var esprima = require('esprima');

//let exprStr = "p.sub == r.sub && p.obj == r.obj && p.act == p.act || r.sub == 'admin'"
let exprStr = "(a || b) && (c || d)"
let exprBody = esprima.parseScript(exprStr, {range: true}).body
let expr = exprBody[0]
console.log("left: ", exprStr.substring(0, 50), "  right: ", exprStr.substring(54, 70))
console.log("ok")