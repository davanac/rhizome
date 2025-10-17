/**
 * @name SQL injection via string concatenation in pool.query
 * @description Detects SQL queries built with string concatenation instead of parameters
 * @kind problem
 * @problem.severity error
 * @security-severity 9.0
 * @precision high
 * @id rhizome/sql-injection-concatenation
 * @tags security
 *       database
 *       sql-injection
 */

import javascript

/**
 * Represents a database query call
 */
class PoolQueryCall extends CallExpr {
  PoolQueryCall() {
    // pool.query() or client.query()
    exists(PropAccess pa |
      pa = this.getCallee() and
      pa.getPropertyName() = "query" and
      (pa.getBase().(VarAccess).getName() = "pool" or
       pa.getBase().(VarAccess).getName() = "client")
    )
  }

  /**
   * Gets the SQL query argument (first parameter)
   */
  Expr getQueryArg() { result = this.getArgument(0) }
}

/**
 * Checks if query uses string concatenation or template literals with variables
 */
predicate isDynamicQuery(Expr query) {
  // Template literal with substitutions
  query instanceof TemplateLiteral and
  exists(TemplateLiteral tl |
    tl = query and
    tl.getNumElement() > 1  // Has interpolations
  ) or
  // String concatenation with variables
  query instanceof AddExpr and
  exists(AddExpr add |
    add = query and
    (add.getAnOperand() instanceof VarAccess or
     add.getAnOperand() instanceof PropAccess)
  )
}

/**
 * Checks if query uses parameterized query (second argument with array)
 */
predicate usesParameters(PoolQueryCall call) {
  exists(Expr params |
    params = call.getArgument(1) and
    (params instanceof ArrayExpr or
     params.(VarAccess).getName().matches("%param%"))
  )
}

from PoolQueryCall call, Expr query
where
  query = call.getQueryArg() and
  isDynamicQuery(query) and
  not usesParameters(call)
select call,
  "SQL query uses string concatenation without parameterization. Use $1, $2, etc. with parameter array."
