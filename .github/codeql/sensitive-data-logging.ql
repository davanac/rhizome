/**
 * @name Logging sensitive authentication data
 * @description Detects logging of passwords, tokens, private keys, or signatures
 * @kind problem
 * @problem.severity warning
 * @security-severity 6.0
 * @precision medium
 * @id rhizome/sensitive-data-logging
 * @tags security
 *       privacy
 *       credentials
 *       logging
 */

import javascript

/**
 * Represents a logging call
 */
class LoggingCall extends CallExpr {
  LoggingCall() {
    this.getCalleeName().matches("console.%") or
    this.getCallee().(PropAccess).getBase().(VarAccess).getName() = "console"
  }
}

/**
 * Checks if expression refers to sensitive data
 */
predicate isSensitiveData(Expr e) {
  exists(VarAccess va |
    va = e and
    (va.getName().toLowerCase().matches("%password%") or
     va.getName().toLowerCase().matches("%secret%") or
     va.getName().toLowerCase().matches("%token%") or
     va.getName().toLowerCase().matches("%private%key%") or
     va.getName().toLowerCase().matches("%signature%") or
     va.getName().toLowerCase().matches("%nonce%"))
  ) or
  exists(PropAccess pa |
    pa = e and
    (pa.getPropertyName().toLowerCase().matches("%password%") or
     pa.getPropertyName().toLowerCase().matches("%secret%") or
     pa.getPropertyName().toLowerCase().matches("%token%") or
     pa.getPropertyName() = "JWT_SECRET" or
     pa.getPropertyName().toLowerCase().matches("%private%key%") or
     pa.getPropertyName().toLowerCase().matches("%signature%"))
  )
}

from LoggingCall log, Expr sensitive
where
  sensitive = log.getAnArgument() and
  isSensitiveData(sensitive)
select log,
  "Logging sensitive data (" + sensitive.toString() + "). This may expose credentials in logs."
