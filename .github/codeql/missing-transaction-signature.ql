/**
 * @name Blockchain transaction without signature verification
 * @description Detects blockchain operations that don't verify user signatures
 * @kind problem
 * @problem.severity warning
 * @security-severity 7.0
 * @precision medium
 * @id rhizome/missing-transaction-signature
 * @tags security
 *       blockchain
 *       smart-contract
 *       authorization
 */

import javascript

/**
 * Represents a blockchain transaction function
 */
class BlockchainTransactionFunction extends Function {
  BlockchainTransactionFunction() {
    // Functions that send transactions
    exists(CallExpr call |
      call.getEnclosingFunction() = this and
      (call.getCalleeName().matches("%send%") or
       call.getCalleeName().matches("%execute%") or
       call.getCallee().(PropAccess).getPropertyName() = "sendTransaction" or
       call.getCallee().(PropAccess).getPropertyName() = "send")
    ) and
    // Related to contracts
    (this.getName().toLowerCase().matches("%contract%") or
     this.getName().toLowerCase().matches("%mint%") or
     this.getName().toLowerCase().matches("%transfer%") or
     this.getName().toLowerCase().matches("%blockchain%"))
  }
}

/**
 * Checks if function verifies user authorization
 */
predicate verifiesAuthorization(Function f) {
  // Checks req.user (from JWT middleware)
  exists(PropAccess auth |
    auth.getEnclosingFunction() = f and
    auth.getBase().(VarAccess).getName() = "req" and
    auth.getPropertyName() = "user"
  ) or
  // Calls signature verification
  exists(CallExpr call |
    call.getEnclosingFunction() = f and
    (call.getCalleeName().matches("%verify%") or
     call.getCalleeName().matches("%authenticate%"))
  )
}

from BlockchainTransactionFunction func
where not verifiesAuthorization(func)
select func,
  "Blockchain transaction function does not verify user authorization before executing."
