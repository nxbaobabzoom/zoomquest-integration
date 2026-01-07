#!/bin/bash
# OWASP ZAP Full Security Scan (Active + Passive)
# Usage: ./scripts/zap-full-scan.sh [TARGET_URL]
# WARNING: Active scans can be disruptive. Only run on staging/test environments.

TARGET_URL=${1:-"http://localhost:3000"}
ZAP_PORT=8080
ZAP_HOST="localhost"
REPORT_DIR="security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "OWASP ZAP Full Security Scan (Active + Passive)"
echo "================================================"
echo "Target URL: $TARGET_URL"
echo "Timestamp: $TIMESTAMP"
echo ""
echo "⚠️  WARNING: This scan includes active testing which may:"
echo "   - Modify application state"
echo "   - Create test data"
echo "   - Potentially disrupt services"
echo ""
read -p "Continue with full scan? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Scan cancelled."
    exit 0
fi

# Create reports directory
mkdir -p "$REPORT_DIR"

# Start ZAP if not running
if ! curl -s "http://$ZAP_HOST:$ZAP_PORT" > /dev/null 2>&1; then
    echo "Starting ZAP..."
    docker run -d \
        --name zap-full \
        -p $ZAP_PORT:8080 \
        owasp/zap2docker-stable \
        zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.disablekey=true
    
    echo "Waiting for ZAP to start..."
    sleep 15
fi

echo ""
echo "Step 1: Spidering the application..."
docker run -i --rm \
    --network host \
    owasp/zap2docker-stable \
    zap-cli -p $ZAP_PORT spider "$TARGET_URL"

echo ""
echo "Step 2: Running active scan..."
echo "This may take 10-30 minutes depending on application size..."
docker run -i --rm \
    --network host \
    owasp/zap2docker-stable \
    zap-cli -p $ZAP_PORT active-scan "$TARGET_URL"

echo ""
echo "Step 3: Generating reports..."
docker run -i --rm \
    --network host \
    owasp/zap2docker-stable \
    zap-cli -p $ZAP_PORT report -o "$REPORT_DIR/zap-full-report-$TIMESTAMP.html" -f html

docker run -i --rm \
    --network host \
    owasp/zap2docker-stable \
    zap-cli -p $ZAP_PORT report -o "$REPORT_DIR/zap-full-report-$TIMESTAMP.json" -f json

echo ""
echo "Full scan completed!"
echo "Reports saved to:"
echo "  - HTML: $REPORT_DIR/zap-full-report-$TIMESTAMP.html"
echo "  - JSON: $REPORT_DIR/zap-full-report-$TIMESTAMP.json"
echo ""
echo "Please review the reports for all security issues."

