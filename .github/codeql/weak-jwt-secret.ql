/**
 * @name Weak or hardcoded JWT secret
 * @description Detects JWT secrets that are hardcoded or potentially weak
 * @kind problem
 * @problem.severity error
 * @security-severity 8.5
 * @precision high
 * @id rhizome/weak-jwt-secret
 * @tags security
 *       authentication
 *       jwt
 *       credentials
 */

import javascript

/**
 * Represents a JWT signing operation
 */
class JwtSignCall extends CallExpr {
  JwtSignCall() {
    // jwt.sign() calls
    this.getCallee().(PropAccess).getPropertyName() = "sign" and
    exists(VarAccess va |
      va = this.getCallee().(PropAccess).getBase() and
      va.getName() = "jwt"
    )
  }

  /**
   * Gets the secret argument (second parameter)
   */
  Expr getSecretArg() { result = this.getArgument(1) }
}

/**
 * Represents a hardcoded string literal
 */
predicate isHardcodedSecret(Expr e) {
  e instanceof StringLiteral and
  not e.(StringLiteral).getValue() = ""
}

/**
 * Represents a potentially weak secret from config
 */
predicate isPotentiallyWeakConfig(Expr e) {
  exists(PropAccess pa |
    e = pa and
    pa.getPropertyName() = "JWT_SECRET" and
    // Check if there's no validation of secret strength
    not exists(CallExpr validation |
      validation.getAnArgument() = pa and
      validation.getCalleeName().matches("%validate%") or
      validation.getCalleeName().matches("%check%")
    )
  )
}

from JwtSignCall call, Expr secret, string message
where
  secret = call.getSecretArg() and
  (
    (isHardcodedSecret(secret) and
     message = "JWT secret is hardcoded. Use environment variables instead.") or
    (isPotentiallyWeakConfig(secret) and
     message = "JWT secret from config may be weak. Ensure it's at least 32 characters.")
  )
select call, message
