# Security Scripts

This directory contains scripts for security and performance management.

## Scripts

### `generate-csp-hashes.sh`

Generates SHA-256 hashes for Unity WebGL JavaScript files for CSP configuration.

**Usage:**
```bash
./scripts/generate-csp-hashes.sh
```

**Output:**
- Lists all Unity .js files with their SHA-256 hashes
- Provides CSP `script-src` directive with all hashes

**When to run:**
- After Unity build changes
- Before deploying to production
- When CSP violations occur

---

### `zap-baseline-scan.sh`

Runs OWASP ZAP baseline security scan (passive only, non-intrusive).

**Usage:**
```bash
./scripts/zap-baseline-scan.sh [TARGET_URL]
```

**Examples:**
```bash
# Scan local development server
./scripts/zap-baseline-scan.sh http://localhost:3000

# Scan production/staging
./scripts/zap-baseline-scan.sh https://your-app.vercel.app
```

**Requirements:**
- Docker installed (or ZAP running on port 8080)
- Target URL accessible

**Output:**
- `security-reports/zap-report-YYYYMMDD_HHMMSS.json`
- `security-reports/zap-report-YYYYMMDD_HHMMSS.html`

**Exit codes:**
- `0`: No critical/high issues found
- `1`: Critical or high-risk issues detected

---

### `zap-full-scan.sh`

Runs comprehensive OWASP ZAP scan (active + passive). **Use with caution!**

**Usage:**
```bash
./scripts/zap-full-scan.sh [TARGET_URL]
```

**⚠️ WARNING:**
- Active scans can modify application state
- Only run on staging/test environments
- May create test data
- Can be disruptive

**Requirements:**
- Docker installed
- Target URL accessible
- Confirmation prompt (y/N)

**Output:**
- `security-reports/zap-full-report-YYYYMMDD_HHMMSS.json`
- `security-reports/zap-full-report-YYYYMMDD_HHMMSS.html`

---

## Setup

### Prerequisites

1. **Docker** (for ZAP scans):
   ```bash
   # Verify Docker is installed
   docker --version
   
   # Pull ZAP image
   docker pull owasp/zap2docker-stable
   ```

2. **OpenSSL** (for CSP hash generation):
   ```bash
   # macOS
   brew install openssl
   
   # Linux (usually pre-installed)
   # Verify with: openssl version
   ```

### Making Scripts Executable

Scripts should already be executable. If not:

```bash
chmod +x scripts/*.sh
```

---

## Workflow

### Before Production Deployment

1. **Generate CSP hashes** (if Unity build changed):
   ```bash
   ./scripts/generate-csp-hashes.sh
   # Update vercel.json with new hashes
   ```

2. **Run baseline security scan**:
   ```bash
   ./scripts/zap-baseline-scan.sh https://staging-url.vercel.app
   ```

3. **Review scan results**:
   - Check for critical/high issues
   - Address security concerns
   - Verify CSP compliance

4. **Deploy to production**:
   - Only if scan passes (exit code 0)
   - Verify headers in production
   - Monitor memory usage

### Regular Maintenance

- **Weekly**: Run baseline scan on staging
- **Monthly**: Run full scan on staging
- **After Unity updates**: Regenerate CSP hashes
- **After security updates**: Re-run scans

---

## Troubleshooting

### ZAP Not Starting

**Issue**: Script can't connect to ZAP

**Solutions**:
1. Check if Docker is running: `docker ps`
2. Check if port 8080 is available: `lsof -i :8080`
3. Start ZAP manually:
   ```bash
   docker run -d -p 8080:8080 \
     --name zap \
     owasp/zap2docker-stable \
     zap.sh -daemon -host 0.0.0.0 -port 8080 \
     -config api.disablekey=true
   ```

### CSP Hash Generation Fails

**Issue**: `openssl` command not found

**Solutions**:
1. Install OpenSSL (see Prerequisites)
2. Verify installation: `openssl version`
3. Check file paths in script

### Scan Takes Too Long

**Issue**: Full scan runs for hours

**Solutions**:
1. Use baseline scan for quick checks
2. Limit scan scope in ZAP configuration
3. Exclude Unity binary files (already configured)
4. Run scans during off-peak hours

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Security Scan

on:
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Run OWASP ZAP Baseline Scan
        run: |
          chmod +x scripts/*.sh
          ./scripts/zap-baseline-scan.sh ${{ secrets.STAGING_URL }}
      
      - name: Upload scan results
        uses: actions/upload-artifact@v2
        if: always()
        with:
          name: zap-report
          path: security-reports/
```

---

## Additional Resources

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [CSP Hash Generator](https://report-uri.com/home/hash)
- [Security Best Practices](../SECURITY.md)

