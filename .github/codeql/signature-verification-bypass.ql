/**
 * @name Missing signature verification in authentication flow
 * @description Detects authentication service functions that don't verify cryptographic signatures
 * @kind problem
 * @problem.severity error
 * @security-severity 9.0
 * @precision medium
 * @id rhizome/missing-signature-verification
 * @tags security
 *       authentication
 *       web3auth
 *       cryptography
 */

import javascript

/**
 * Represents a backend authentication service function
 * Excludes controllers, UI components, and generic utilities
 */
class AuthServiceHandler extends Function {
  AuthServiceHandler() {
    // Must be in backend service files (not controllers or UI)
    this.getFile().getRelativePath().matches("%service%") and
    not this.getFile().getRelativePath().matches("%controller%") and
    not this.getFile().getRelativePath().matches("%front/%") and
    not this.getFile().getRelativePath().matches("%dist/%") and
    (
      // Functions that handle Web3Auth registration/login
      (this.getName().toLowerCase().matches("%loginorregister%") or
       this.getName().toLowerCase().matches("%web3auth%login%")) or
      // Functions that accept both walletAddress AND signature parameters
      (exists(Parameter p1, Parameter p2 |
        p1 = this.getAParameter() and
        p2 = this.getAParameter() and
        p1 != p2 and
        p1.getName().matches("%signature%") and
        p2.getName().toLowerCase().matches("%wallet%")
      ))
    )
  }
}

/**
 * Represents a call to signature verification
 */
class SignatureVerificationCall extends CallExpr {
  SignatureVerificationCall() {
    // Direct calls to verifyAuthSignature (our function)
    this.getCalleeName() = "verifyAuthSignature" or
    // Calls to ethers.verifyMessage
    this.getCallee().(PropAccess).getPropertyName() = "verifyMessage"
  }
}

/**
 * Checks if a function performs signature verification directly or calls a function that does
 */
predicate hasSignatureVerification(Function f) {
  // Direct verification in function
  exists(SignatureVerificationCall call |
    call.getEnclosingFunction() = f
  ) or
  // Calls another function that verifies (delegation pattern)
  exists(CallExpr call |
    call.getEnclosingFunction() = f and
    call.getCalleeName().toLowerCase().matches("%verify%signature%")
  )
}

from AuthServiceHandler handler
where not hasSignatureVerification(handler)
select handler,
  "Backend authentication service function does not verify cryptographic signatures before creating sessions."
