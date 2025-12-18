# Security Policy

## Reporting a Vulnerability

We take the security of Themifier and its users seriously. If you believe you have found a security vulnerability in the extension, please report it to us as described below.

### Please Do Not

- **Do not** open a public GitHub issue for security vulnerabilities
- **Do not** disclose the vulnerability publicly until we've had a chance to address it

### How to Report

**Email us at:** [hello@desource-labs.org](mailto:hello@desource-labs.org)

Please include the following information in your report:

1. **Description** — Clear description of the vulnerability
2. **Impact** — What can an attacker achieve?
3. **Affected Versions** — Which versions are affected?
4. **Reproduction Steps** — Step-by-step instructions to reproduce
5. **Proof of Concept** — Code sample or exploit demonstration (if applicable)
6. **Suggested Fix** — Your recommendation for fixing the issue (optional)

### Example Report

```
Subject: [SECURITY] XSS vulnerability in theme selector

Component: AppPopup.vue
Version: 1.0.0

Description:
The theme selector does not properly sanitize user input in custom theme names,
allowing XSS attacks through stored preferences.

Impact:
An attacker can inject malicious scripts that execute when the extension popup
is opened, potentially stealing user preferences or injecting theme code.

Reproduction:
1. Open extension options
2. Create custom theme with name: <img src=x onerror="alert('XSS')">
3. Open popup
4. Script executes

Suggested Fix:
Sanitize all user input before rendering or use textContent instead of innerHTML.
```

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 5 business days
- **Fix Timeline:** Depends on severity
  - **Critical:** 1-7 days
  - **High:** 7-30 days
  - **Medium/Low:** 30-90 days

### What to Expect

1. **Acknowledgment** — We'll confirm receipt of your report
2. **Investigation** — We'll validate and assess the severity
3. **Fix Development** — We'll work on a patch
4. **Disclosure** — We'll coordinate disclosure timing with you
5. **Credit** — We'll credit you in our security advisory (if desired)

## Security Best Practices

When using Themifier, we recommend:

### Keep Updated

Update the extension regularly:

- Enable auto-updates in Chrome
- Check the [Chrome Web Store](https://chrome.google.com/webstore/detail/themifier) for updates
- Monitor [GitHub Releases](https://github.com/DeSource-Labs/themifier/releases)

### Disable if Not Using

- Disable the extension on sites where you don't need theming
- This reduces the extension's access surface

## Security Updates

Security updates are released as:

- **Manual updates** through Chrome Web Store
- **GitHub Security Advisories** for high/critical vulnerabilities
- **Changelog entries** marked with `[SECURITY]`

Subscribe to:

- [GitHub Security Advisories](https://github.com/DeSource-Labs/themifier/security/advisories)
- [GitHub Releases](https://github.com/DeSource-Labs/themifier/releases)

## Known Issues

There are currently no known security issues.

## Scope

### In Scope

- Themifier Chrome extension
- All content scripts and background workers
- Settings storage and retrieval
- Message passing between components

### Out of Scope

- Denial of Service (DoS) via excessive theme switching
- Social engineering attacks
- Physical attacks
- Issues in third-party dependencies (report to respective maintainers)
- Theoretical vulnerabilities without proof of concept
- Issues in Chrome browser itself

## Acknowledgments

We appreciate the security research community and will acknowledge contributors who report valid security issues (with permission).

### Hall of Fame

_No security reports yet. Be the first!_

## Contact

- **Security Email:** [hello@desource-labs.org](mailto:hello@desource-labs.org)
- **GitHub:** [@DeSource-Labs](https://github.com/DeSource-Labs)

---

<div align="center">
  <sub>We follow <a href="https://en.wikipedia.org/wiki/Responsible_disclosure">responsible disclosure</a> principles</sub>
</div>
