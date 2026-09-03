# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| v4.x    | ✅ Active support  |
| < v4    | ❌ Not supported   |

## Reporting a Vulnerability

If you discover a security vulnerability in Sentinel, please report it responsibly:

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Email the maintainer directly with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
3. Allow up to 72 hours for an initial response
4. Coordinate disclosure timing with the maintainer

## Security Considerations

Sentinel handles order and customer data. When deploying:

- **Never commit `.env` files** — use `.env.example` as a template
- **Rotate API keys** (Groq, Twilio) regularly
- **Use HTTPS** in production for all API traffic
- **Restrict CORS origins** — replace the `allow_origins=["*"]` wildcard with your frontend domain
- **Use PostgreSQL** in production — SQLite is for development only
- **Sanitize CSV uploads** — validate all fields before database insertion
- **Audit overrides** — the override log is your audit trail for compliance

## Dependency Security

- Run `pip audit` periodically for Python dependency vulnerabilities
- Run `npm audit` for frontend dependency vulnerabilities
- Keep all dependencies updated to their latest stable versions
