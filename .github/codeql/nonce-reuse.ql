/**
 * @name Nonce reuse or missing nonce in signature verification
 * @description Detects signature verification without nonce validation (replay attack vulnerability)
 * @kind problem
 * @problem.severity error
 * @security-severity 8.0
 * @precision medium
 * @id rhizome/nonce-reuse
 * @tags security
 *       authentication
 *       cryptography
 *       replay-attack
 */

import javascript

/**
 * Represents a signature verification function
 */
class SignatureVerificationFunction extends Function {
  SignatureVerificationFunction() {
    this.getName().toLowerCase().matches("%verify%signature%") or
    this.getName().toLowerCase().matches("%verify%auth%") or
    exists(CallExpr call |
      call.getEnclosingFunction() = this and
      (call.getCalleeName() = "verifyMessage" or
       call.getCallee().(PropAccess).getPropertyName() = "verifyMessage")
    )
  }
}

/**
 * Checks if function validates nonce freshness
 */
predicate validatesNonceFreshness(Function f) {
  exists(CallExpr deleteCall |
    // Deletes nonce after use
    deleteCall.getEnclosingFunction() = f and
    deleteCall.getCalleeName() = "delete" and
    exists(PropAccess pa |
      pa = deleteCall.getAnArgument() and
      pa.getPropertyName().matches("%nonce%")
    )
  ) or
  exists(VarAccess va |
    // References expiry time or timestamp
    va.getEnclosingFunction() = f and
    (va.getName().matches("%expiry%") or va.getName().matches("%timestamp%"))
  )
}

/**
 * Checks if function constructs message with nonce
 */
predicate usesNonceInMessage(Function f) {
  exists(TemplateLiteral template |
    template.getEnclosingFunction() = f and
    exists(Expr elem |
      elem = template.getAnElement() and
      elem.(VarAccess).getName().matches("%nonce%")
    )
  ) or
  exists(VarAccess va |
    va.getEnclosingFunction() = f and
    va.getName().matches("%nonce%")
  )
}

from SignatureVerificationFunction func, string issue
where
  (not usesNonceInMessage(func) and
   issue = "Signature verification does not include nonce in message, allowing replay attacks.") or
  (usesNonceInMessage(func) and
   not validatesNonceFreshness(func) and
   issue = "Signature verification uses nonce but does not validate freshness or delete after use.")
select func, issue
