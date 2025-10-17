/**
 * @name Insecure JWT algorithm or missing algorithm validation
 * @description Detects JWT verification without algorithm validation (algorithm confusion attack)
 * @kind problem
 * @problem.severity error
 * @security-severity 8.0
 * @precision high
 * @id rhizome/insecure-jwt-algorithm
 * @tags security
 *       authentication
 *       jwt
 *       algorithm-confusion
 */

import javascript

/**
 * Represents a JWT verification call
 */
class JwtVerifyCall extends CallExpr {
  JwtVerifyCall() {
    // jwt.verify() calls
    this.getCallee().(PropAccess).getPropertyName() = "verify" and
    exists(VarAccess va |
      va = this.getCallee().(PropAccess).getBase() and
      va.getName() = "jwt"
    )
  }

  /**
   * Gets the options argument (third parameter)
   */
  Expr getOptionsArg() { result = this.getArgument(2) }
}

/**
 * Checks if options specify allowed algorithms
 */
predicate specifiesAlgorithms(Expr options) {
  exists(ObjectExpr obj, Property prop |
    obj = options and
    prop = obj.getAProperty() and
    prop.getName() = "algorithms" and
    // Has an array of allowed algorithms
    prop.getInit() instanceof ArrayExpr
  )
}

/**
 * Checks if options allow insecure 'none' algorithm
 */
predicate allowsNoneAlgorithm(Expr options) {
  exists(ObjectExpr obj, Property prop, ArrayExpr arr, StringLiteral alg |
    obj = options and
    prop = obj.getAProperty() and
    prop.getName() = "algorithms" and
    arr = prop.getInit() and
    alg = arr.getAnElement() and
    alg.getValue() = "none"
  )
}

from JwtVerifyCall call, string issue
where
  // No options provided (uses defaults, may accept any algorithm)
  (not exists(call.getOptionsArg()) and
   issue = "JWT verification without algorithm validation. Vulnerable to algorithm confusion attacks.") or
  // Options provided but no algorithms specified
  (exists(call.getOptionsArg()) and
   not specifiesAlgorithms(call.getOptionsArg()) and
   issue = "JWT verification options do not specify allowed algorithms.") or
  // Explicitly allows 'none' algorithm
  (allowsNoneAlgorithm(call.getOptionsArg()) and
   issue = "JWT verification allows 'none' algorithm, enabling signature bypass.")
select call, issue
