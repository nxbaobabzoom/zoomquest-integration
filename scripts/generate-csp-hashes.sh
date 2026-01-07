#!/bin/bash
# Generate CSP SHA-256 hashes for Unity WebGL files
# Usage: ./scripts/generate-csp-hashes.sh

echo "Generating CSP SHA-256 hashes for Unity WebGL files..."
echo "=================================================="
echo ""

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "Error: openssl is not installed. Please install it first."
    exit 1
fi

# Directory containing Unity build files
BUILD_DIR="public/Build"

if [ ! -d "$BUILD_DIR" ]; then
    echo "Error: Build directory not found at $BUILD_DIR"
    exit 1
fi

echo "Unity JavaScript Files:"
echo "----------------------"

# Generate hashes for all .js files
for file in "$BUILD_DIR"/*.js; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        hash=$(openssl dgst -sha256 -binary "$file" | openssl base64)
        echo "$filename:"
        echo "  Hash: sha256-$hash"
        echo ""
    fi
done

echo "CSP script-src directive:"
echo "-------------------------"
echo -n "script-src 'self' "

# Generate CSP directive with all hashes
for file in "$BUILD_DIR"/*.js; do
    if [ -f "$file" ]; then
        hash=$(openssl dgst -sha256 -binary "$file" | openssl base64)
        echo -n "'sha256-$hash' "
    fi
done

echo "'unsafe-inline' 'unsafe-eval' https://appssdk.zoom.us"
echo ""
echo "Note: Update vercel.json with these hashes after Unity build changes."

