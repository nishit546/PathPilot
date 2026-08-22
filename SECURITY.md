# Security Policy

## Supported Versions

PathPilot actively supports the latest release on the `main` branch.

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

We take the security of PathPilot, our users' travel data, and platform infrastructure very seriously.

If you discover a security vulnerability or sensitive data leak:

1. **Do NOT publicly disclose the issue** in open GitHub issues or social media.
2. **Privately email our security team** at:
   - **Email**: [security@pathpilot.dev](mailto:security@pathpilot.dev)
3. Please include:
   - Type of vulnerability (e.g. SQL Injection, XSS, CSRF, IDOR, Broken Authentication)
   - Detailed step-by-step instructions to reproduce the issue
   - Proof-of-concept (PoC) code or HTTP request payloads where applicable
   - Impact assessment

---

## Security Commitments & Response Timeline

- **Initial Response**: Within 24–48 hours.
- **Triage & Validation**: Within 72 hours.
- **Patch & Fix Deployment**: Critical vulnerabilities are patched within 5 business days.
- **Attribution**: Responsible disclosures will be credited in our Security Hall of Fame (unless requested otherwise).

---

## Security Best Practices for Self-Hosting

When deploying PathPilot to production:
1. Ensure `SUPABASE_JWT_SECRET` is strong, random, and kept confidential.
2. Always run PostgreSQL connections over TLS/SSL (`sslmode=require`).
3. Set `CORS_ORIGIN` to your explicit frontend production domains in `.env`.
4. Enable rate limiting and HTTPS across all reverse proxies (e.g., NGINX / Cloudflare).
