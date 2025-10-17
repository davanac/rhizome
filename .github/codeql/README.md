# Custom CodeQL Security Queries for Rhizome

This directory contains custom CodeQL queries tailored to Rhizome's security-critical components: Web3Auth authentication, JWT implementation, blockchain operations, and database access.

## Query Overview

### 🔴 Critical Severity

#### 1. `signature-verification-bypass.ql`
**What it detects:** Backend authentication service functions that don't verify cryptographic signatures

**Why it matters:**
- Web3Auth authentication requires signature verification to prove wallet ownership
- Missing verification allows attackers to impersonate any wallet address
- Could lead to complete account takeover

**Scope:**
- Focuses on **backend service layer** only (not controllers, UI, or utilities)
- Excludes frontend code (verification happens on backend)
- Excludes controller delegation pattern (calls service that verifies)
- Excludes generic utility functions

**Example vulnerability:**
```javascript
// ❌ BAD - No signature verification
export const loginOrRegisterWithWeb3Auth = async ({ walletAddress, web3authId }) => {
  // Directly creates session without verifying signature
  const userId = await createUser(walletAddress);
  return { success: true, userId };
};

// ✅ GOOD - Verifies signature
export const loginOrRegisterWithWeb3Auth = async ({ walletAddress, signature, web3authId }) => {
  if (!verifyAuthSignature(walletAddress, signature, web3authId)) {
    return { success: false, message: "Invalid signature" };
  }
  const userId = await createUser(walletAddress);
  return { success: true, userId };
};
```

**False Positive Reduction:**
- v2.0: Reduced precision from "high" to "medium" to focus on actual service functions
- Excludes: controllers (delegate to services), frontend (verifies on backend), dist files (bundled code)

#### 2. `weak-jwt-secret.ql`
**What it detects:** Hardcoded or weak JWT secrets

**Why it matters:**
- Weak JWT secrets can be brute-forced
- Hardcoded secrets in code are exposed in version control
- Compromised secret allows token forgery

**Example vulnerability:**
```javascript
// ❌ BAD - Hardcoded secret
jwt.sign(payload, "my-secret-key");

// ✅ GOOD - Environment variable
jwt.sign(payload, process.env.JWT_SECRET);
```

#### 3. `sql-injection-concatenation.ql`
**What it detects:** SQL queries using string concatenation instead of parameters

**Why it matters:**
- String concatenation enables SQL injection attacks
- Attackers can execute arbitrary SQL commands
- Could lead to data theft, modification, or deletion

**Example vulnerability:**
```javascript
// ❌ BAD - SQL injection vulnerable
const userId = req.params.id;
pool.query(`SELECT * FROM users WHERE id = '${userId}'`);

// ✅ GOOD - Parameterized query
pool.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### 🟠 High Severity

#### 4. `nonce-reuse.ql`
**What it detects:** Signature verification without nonce validation

**Why it matters:**
- Replay attacks: attacker reuses valid signatures
- Without nonce freshness check, old signatures remain valid
- Enables authentication bypass

**Example vulnerability:**
```javascript
// ❌ BAD - No nonce validation
export const verifySignature = (address, signature) => {
  const message = "Sign this message";
  return ethers.verifyMessage(message, signature) === address;
};

// ✅ GOOD - Nonce with expiry
export const verifySignature = (address, signature, nonce) => {
  const stored = nonceStore.get(address);
  if (!stored || Date.now() > stored.expiryTime) return false;

  const message = `Sign this message\nNonce: ${stored.nonce}`;
  const valid = ethers.verifyMessage(message, signature) === address;

  nonceStore.delete(address); // One-time use
  return valid;
};
```

#### 5. `insecure-jwt-algorithm.ql`
**What it detects:** JWT verification without algorithm validation

**Why it matters:**
- Algorithm confusion attacks (switch HS256 to none)
- Attacker can create unsigned tokens
- Bypasses authentication completely

**Example vulnerability:**
```javascript
// ❌ BAD - No algorithm validation
jwt.verify(token, secret);

// ✅ GOOD - Explicit algorithm
jwt.verify(token, secret, { algorithms: ['HS256'] });
```

### 🟡 Medium Severity

#### 6. `missing-transaction-signature.ql`
**What it detects:** Blockchain transactions without user authorization

**Why it matters:**
- Unauthorized blockchain operations
- Could execute transactions on behalf of users
- Financial loss or incorrect NFT minting

**Example vulnerability:**
```javascript
// ❌ BAD - No auth check
app.post('/mint-nft', async (req, reply) => {
  const { projectId } = req.body;
  await mintNFT(projectId); // Anyone can mint
});

// ✅ GOOD - Requires authentication
app.post('/mint-nft', authenticateUser, async (req, reply) => {
  const { projectId } = req.body;
  if (req.user.userId !== project.ownerId) {
    return reply.status(403).send({ message: "Unauthorized" });
  }
  await mintNFT(projectId);
});
```

#### 7. `sensitive-data-logging.ql`
**What it detects:** Logging of passwords, tokens, keys, or signatures

**Why it matters:**
- Credentials exposed in log files
- Log aggregation services see sensitive data
- Compliance violations (GDPR, etc.)

**Example vulnerability:**
```javascript
// ❌ BAD - Logs password
console.log('User login:', { email, password });

// ✅ GOOD - Redacts sensitive data
console.log('User login:', { email, password: '[REDACTED]' });
```

## Running the Queries

### Local Analysis

```bash
# Install CodeQL CLI
# https://github.com/github/codeql-cli-binaries/releases

# Create database
codeql database create rhizome-db --language=javascript

# Run all queries
codeql database analyze rhizome-db .github/codeql/*.ql --format=sarif-latest --output=results.sarif

# Run specific query
codeql database analyze rhizome-db .github/codeql/signature-verification-bypass.ql --format=sarif-latest --output=signature-results.sarif
```

### GitHub Actions Integration

Add to `.github/workflows/codeql.yml`:

```yaml
name: "CodeQL Security Analysis"

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      security-events: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript
          queries: .github/codeql/*.ql

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
```

## Query Maintenance

### Adding New Queries

1. Identify security-critical patterns in code
2. Write CodeQL query following existing patterns
3. Test query locally
4. Document in this README
5. Add to CI/CD pipeline

### Query Quality Guidelines

- **High precision**: Minimize false positives
- **Clear messages**: Explain the vulnerability and fix
- **Specific to Rhizome**: Tailored to our authentication/blockchain patterns
- **Well-documented**: Include examples and references

## Security Coverage Matrix

| Component | Queries | Coverage |
|-----------|---------|----------|
| Web3Auth Authentication | `signature-verification-bypass.ql`, `nonce-reuse.ql` | ✅ Critical paths |
| JWT Implementation | `weak-jwt-secret.ql`, `insecure-jwt-algorithm.ql` | ✅ Token lifecycle |
| Database Access | `sql-injection-concatenation.ql` | ✅ All queries |
| Blockchain Operations | `missing-transaction-signature.ql` | ✅ Smart contract calls |
| Logging | `sensitive-data-logging.ql` | ✅ All log statements |

## References

- [CodeQL JavaScript/TypeScript Reference](https://codeql.github.com/docs/codeql-language-guides/codeql-for-javascript/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Ethereum Signature Best Practices](https://eips.ethereum.org/EIPS/eip-191)

## Support

For questions about these queries:
1. Review query comments and examples
2. Check CodeQL documentation
3. Contact security team

**Note:** These queries complement (not replace) standard CodeQL security queries. Run both for comprehensive coverage.
