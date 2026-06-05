# Security Policy

## Reporting

Do not open public issues for suspected vulnerabilities. Email
`hello@influenziaclub.com` with the subject `Security report`, affected
endpoint, reproduction steps, and impact. Do not include real user data or
credentials.

## Supported Version

Only the current production release on the `main` branch receives security
updates.

## Operational Requirements

- Keep `.env`, database backups, SMTP passwords, and payment credentials out of Git.
- Rotate secrets immediately after suspected disclosure.
- Apply dependency and VPS security updates regularly.
- Keep payments and payouts disabled until their provider webhooks and settlement
  workflows have passed staging verification.
