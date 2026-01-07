#!/bin/bash
# OWASP ZAP Baseline Security Scan
# Usage: ./scripts/zap-baseline-scan.sh [TARGET_URL]
# Example: ./scripts/zap-baseline-scan.sh https://your-app.vercel.app

TARGET_URL=${1:-"http://localhost:3000"}
ZAP_PORT=8080
ZAP_HOST="localhost"
REPORT_DIR="security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "OWASP ZAP Baseline Security Scan"
echo "================================="
echo "Target URL: $TARGET_URL"
echo "Timestamp: $TIMESTAMP"
echo ""

# Create reports directory
mkdir -p "$REPORT_DIR"

# Check if ZAP is running
echo "Checking if ZAP is running on port $ZAP_PORT..."
if ! curl -s "http://$ZAP_HOST:$ZAP_PORT" > /dev/null 2>&1; then
    echo "ZAP is not running. Starting ZAP Docker container..."
    echo "Please ensure Docker is installed and running."
    echo ""
    echo "To start ZAP manually, run:"
    echo "  docker run -d -p $ZAP_PORT:8080 owasp/zap2docker-stable zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.disablekey=true"
    echo ""
    read -p "Press Enter to start ZAP container automatically, or Ctrl+C to exit..."
    
    # Start ZAP container
    docker run -d \
        --name zap-baseline \
        -p $ZAP_PORT:8080 \
        owasp/zap2docker-stable \
        zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.disablekey=true
    
    echo "Waiting for ZAP to start..."
    sleep 10
    
    # Wait for ZAP to be ready
    for i in {1..30}; do
        if curl -s "http://$ZAP_HOST:$ZAP_PORT" > /dev/null 2>&1; then
            echo "ZAP is ready!"
            break
        fi
        echo "Waiting for ZAP... ($i/30)"
        sleep 2
    done
fi

# Run baseline scan
echo ""
echo "Starting baseline scan..."
echo "This may take several minutes..."
echo ""

docker run -i --rm \
    --network host \
    owasp/zap2docker-stable \
    zap-baseline.py \
    -t "$TARGET_URL" \
    -J "$REPORT_DIR/zap-report-$TIMESTAMP.json" \
    -r "$REPORT_DIR/zap-report-$TIMESTAMP.html" \
    -I \
    -g gen.conf \
    -d

# Check scan results
if [ -f "$REPORT_DIR/zap-report-$TIMESTAMP.json" ]; then
    echo ""
    echo "Scan completed!"
    echo "Reports saved to:"
    echo "  - JSON: $REPORT_DIR/zap-report-$TIMESTAMP.json"
    echo "  - HTML: $REPORT_DIR/zap-report-$TIMESTAMP.html"
    echo ""
    
    # Check for high/critical issues
    HIGH_ISSUES=$(grep -c '"risk":"High"' "$REPORT_DIR/zap-report-$TIMESTAMP.json" 2>/dev/null || echo "0")
    CRITICAL_ISSUES=$(grep -c '"risk":"Critical"' "$REPORT_DIR/zap-report-$TIMESTAMP.json" 2>/dev/null || echo "0")
    
    if [ "$CRITICAL_ISSUES" -gt 0 ] || [ "$HIGH_ISSUES" -gt 0 ]; then
        echo "⚠️  WARNING: Security issues found!"
        echo "   Critical: $CRITICAL_ISSUES"
        echo "   High: $HIGH_ISSUES"
        echo ""
        echo "Please review the reports and address these issues."
        exit 1
    else
        echo "✅ No critical or high-risk issues found."
        echo "Please review the reports for medium and low-risk issues."
    fi
else
    echo "Error: Scan failed or report not generated."
    exit 1
fi

