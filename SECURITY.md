# Security & Performance Documentation

## Table of Contents
1. [Content Security Policy (CSP)](#content-security-policy-csp)
2. [Memory Optimization](#memory-optimization)
3. [OWASP ZAP Security Scanning](#owasp-zap-security-scanning)
4. [Unity Build Optimization](#unity-build-optimization)
5. [Security Headers](#security-headers)
6. [Best Practices](#best-practices)

---

## Content Security Policy (CSP)

### Overview
Our CSP configuration uses SHA-256 hashes to allow specific Unity WebGL scripts while maintaining security. This approach is more secure than using `'unsafe-eval'` globally.

### Current CSP Configuration

The CSP is configured in `vercel.json` with the following hashes:
- **Loader Script**: `sha256-/NJlk8M7ECeHuwSEZrwyU2yBH4Oe4Iraelz9xU8uJU0=`
- **Framework Script**: `sha256-GF3lOttml0ApHp6MdD5JJdDS4GYm+U3rZxb6Lsva92I=`

### Regenerating CSP Hashes

When Unity build files change, regenerate hashes:

```bash
./scripts/generate-csp-hashes.sh
```

This script will:
1. Generate SHA-256 hashes for all Unity JavaScript files
2. Output the CSP `script-src` directive with all hashes
3. Update instructions for `vercel.json`

### CSP Directives Explained

```
script-src: Allows scripts from:
  - 'self': Same origin
  - 'sha256-...': Specific Unity scripts (by hash)
  - 'unsafe-inline': Required for React/Unity inline scripts
  - 'unsafe-eval': Required for Unity WebGL (minimized with hashes)
  - https://appssdk.zoom.us: Zoom Apps SDK

worker-src: 'self' blob: - Allows WebAssembly workers
wasm-unsafe-eval: 'self' - Required for Unity WebGL
frame-ancestors: 'self' https://zoom.us - Allows embedding in Zoom
```

### Zoom CSP Requirements

Zoom requires the following CSP directives:
- ✅ `frame-ancestors` must include `https://zoom.us` and `https://*.zoom.us`
- ✅ `script-src` must include `https://appssdk.zoom.us`
- ✅ All resources should use HTTPS
- ✅ No `'unsafe-eval'` in production (we use hashes + minimal unsafe-eval)

---

## Memory Optimization

### Zoom Memory Limit
**Critical**: Zoom Apps must stay under **256MB** of heap memory to prevent the Zoom Client from killing the process.

### Memory Monitoring

The application includes automatic memory monitoring that:
- Checks memory usage every 5 seconds
- Warns at 200MB (78% of limit)
- Alerts critically at 240MB (94% of limit)
- Attempts automatic garbage collection when critical

### Memory Metrics Tracked

- **WASM Heap**: Unity WebAssembly memory
- **JS Heap**: JavaScript memory
- **Total Memory**: Combined heap size
- **Usage Percentages**: Per-heap utilization

### Viewing Memory Metrics

In development mode, memory metrics are logged to console:
```javascript
Unity Memory Metrics: {
  total: "XX.XX MB / 256 MB",
  wasmHeap: "XX.XX MB / XX.XX MB (XX.X%)",
  jsHeap: "XX.XX MB / XX.XX MB (XX.X%)",
  fps: "XX.XX",
  status: "OK" | "WARNING" | "CRITICAL"
}
```

### Memory Optimization Checklist

- [x] Memory monitoring enabled
- [x] Automatic warnings at 200MB
- [x] Critical alerts at 240MB
- [x] Garbage collection triggers
- [ ] Unity build optimized (see Unity Build Optimization)
- [ ] Asset compression enabled
- [ ] Unused code stripped

---

## OWASP ZAP Security Scanning

### Overview
OWASP ZAP (Zed Attack Proxy) is used to identify security vulnerabilities in the application.

### Prerequisites

1. **Docker** (recommended):
   ```bash
   docker pull owasp/zap2docker-stable
   ```

2. **Or install ZAP directly**:
   - Download from: https://www.zaproxy.org/download/
   - Follow installation instructions

### Running Security Scans

#### Baseline Scan (Recommended First)

Quick passive scan to identify common issues:

```bash
./scripts/zap-baseline-scan.sh https://your-app.vercel.app
```

**What it does:**
- Passive scanning (non-intrusive)
- Checks for missing security headers
- Identifies CSP violations
- Detects common vulnerabilities
- Generates JSON and HTML reports

**Output:**
- `security-reports/zap-report-YYYYMMDD_HHMMSS.json`
- `security-reports/zap-report-YYYYMMDD_HHMMSS.html`

#### Full Scan (Use with Caution)

Comprehensive active + passive scan:

```bash
./scripts/zap-full-scan.sh https://your-app.vercel.app
```

**⚠️ WARNING**: Active scans can:
- Modify application state
- Create test data
- Potentially disrupt services

**Only run on staging/test environments!**

### Interpreting Scan Results

#### Risk Levels

- **Critical**: Immediate action required
- **High**: Address before production
- **Medium**: Address in next release
- **Low**: Consider for future improvements
- **Informational**: Best practices

#### Common Issues for Unity WebGL Apps

1. **CSP Violations**
   - Solution: Update CSP hashes in `vercel.json`

2. **Missing Security Headers**
   - Solution: Verify all headers in `vercel.json`

3. **Mixed Content (HTTP/HTTPS)**
   - Solution: Ensure all resources use HTTPS

4. **Insecure Cookies**
   - Solution: Set `Secure` and `HttpOnly` flags

### CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: OWASP ZAP Baseline Scan
  run: |
    ./scripts/zap-baseline-scan.sh ${{ secrets.STAGING_URL }}
    # Fail build if critical/high issues found
```

---

## Unity Build Optimization

### Memory Optimization Settings

Configure in Unity Editor:

**File → Build Settings → Player Settings → WebGL**

#### Publishing Settings

```
✅ Compression Format: Gzip
✅ Data Caching: Enabled
✅ Memory Size: 256MB (or lower)
✅ Exception Support: Disabled (if possible)
```

#### Optimization Settings

```
✅ Strip Engine Code: Enabled
✅ Managed Stripping Level: High
✅ Strip Unused Mesh Components: Enabled
✅ Strip Unused Physics Components: Enabled
✅ Strip Unused Shaders: Enabled
✅ Optimize Mesh Data: Enabled
```

#### Code Stripping

**Location**: Player Settings → Other Settings → Optimization

```
Code Stripping Level: High
- Removes unused code from build
- Reduces memory footprint
- May break reflection-based code (test thoroughly)
```

### Build Size Optimization

1. **Texture Compression**:
   - Use compressed texture formats
   - Reduce texture sizes where possible
   - Enable texture compression in Unity

2. **Audio Compression**:
   - Use compressed audio formats
   - Reduce audio quality if acceptable

3. **Asset Bundles**:
   - Load assets on-demand
   - Unload unused assets

4. **Code Optimization**:
   - Remove unused scripts
   - Disable unused Unity modules
   - Use IL2CPP for better optimization

### Unity Build Checklist

Before building for production:

- [ ] Strip Engine Code: Enabled
- [ ] Managed Stripping Level: High
- [ ] Memory Size: 256MB or lower
- [ ] Compression: Gzip enabled
- [ ] Data Caching: Enabled
- [ ] Exception Support: Disabled (if possible)
- [ ] Unused components stripped
- [ ] Textures compressed
- [ ] Audio compressed
- [ ] Build size verified (< 50MB recommended)

---

## Security Headers

### Current Security Headers

Configured in `vercel.json`:

1. **Content-Security-Policy**
   - Prevents XSS attacks
   - Controls resource loading
   - Uses SHA-256 hashes for Unity scripts

2. **Strict-Transport-Security (HSTS)**
   - Forces HTTPS connections
   - `max-age=31536000; includeSubDomains; preload`

3. **X-Content-Type-Options**
   - Prevents MIME type sniffing
   - `nosniff`

4. **X-Frame-Options**
   - Controls frame embedding
   - `SAMEORIGIN`

5. **Referrer-Policy**
   - Controls referrer information
   - `strict-origin-when-cross-origin`

6. **Permissions-Policy**
   - Restricts browser features
   - `geolocation=(), microphone=(), camera=()`

### Header Verification

Verify headers are set correctly:

```bash
curl -I https://your-app.vercel.app | grep -i "content-security-policy\|strict-transport-security\|x-content-type-options"
```

Or use browser DevTools:
1. Open Network tab
2. Reload page
3. Check Response Headers

---

## Best Practices

### Development

1. **Always test CSP changes**:
   - Test in Zoom environment
   - Check browser console for violations
   - Verify Unity game loads correctly

2. **Monitor memory in development**:
   - Watch console logs
   - Test with realistic data
   - Profile memory usage

3. **Run security scans regularly**:
   - Before each release
   - After major changes
   - When adding new dependencies

### Production

1. **Security Headers**:
   - ✅ All headers configured
   - ✅ CSP hashes up to date
   - ✅ HTTPS enforced

2. **Memory Management**:
   - ✅ Monitoring enabled
   - ✅ Warnings configured
   - ✅ Cleanup on unmount

3. **Error Handling**:
   - ✅ Error boundaries in place
   - ✅ User-friendly error messages
   - ✅ Error logging configured

### Deployment Checklist

Before deploying to production:

- [ ] CSP hashes regenerated (if Unity build changed)
- [ ] Security headers verified
- [ ] OWASP ZAP scan passed (no critical/high issues)
- [ ] Memory usage tested (< 200MB under load)
- [ ] Unity build optimized
- [ ] Error handling tested
- [ ] Zoom environment tested
- [ ] Performance tested

---

## Troubleshooting

### CSP Violations

**Issue**: Unity game fails to load with CSP errors

**Solution**:
1. Check browser console for specific violation
2. Regenerate CSP hashes: `./scripts/generate-csp-hashes.sh`
3. Update `vercel.json` with new hashes
4. Clear browser cache and retest

### Memory Issues

**Issue**: App crashes or Zoom kills the process

**Solution**:
1. Check memory logs in console
2. Verify Unity build settings (256MB limit)
3. Enable code stripping
4. Reduce asset sizes
5. Test memory cleanup on unmount

### Security Scan Failures

**Issue**: OWASP ZAP finds critical/high issues

**Solution**:
1. Review scan report
2. Address critical issues first
3. Update security headers if needed
4. Re-run scan to verify fixes

---

## Resources

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Unity WebGL Optimization](https://docs.unity3d.com/Manual/webgl-memory.html)
- [Zoom Apps SDK Documentation](https://marketplace.zoom.us/docs/zoom-apps)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## Contact

For security concerns or questions:
- Review team: Yash, Liam, Advikaa
- Documentation: This file
- Scripts: `./scripts/` directory

