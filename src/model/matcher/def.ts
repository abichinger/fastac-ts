import { parseScript } from 'esprima';
import { Expression } from 'estree';

let pArgReg = /([pg][0-9]*)\.([A-Za-z0-9_]+)/g;
let rArgReg = /(r[0-9]*)\.([A-Za-z0-9_]+)/g;

export function policyKey(expr: string): string | undefined {
  let match = pArgReg.exec(expr);
  pArgReg.lastIndex = 0;
  if (match === null) {
    return undefined;
  }
  return match[1];
}

export function reqKey(expr: string): string | undefined {
  let match = rArgReg.exec(expr);
  rArgReg.lastIndex = 0;
  if (match === null) {
    return undefined;
  }
  return match[1];
}

export class MatcherStage {
  ast: Expression;
  expr: string;
  pArgs: string[];
  rArgs: string[];
  children: MatcherStage[];

  constructor(ast: Expression, expr: string) {
    this.ast = ast;
    this.expr = expr;
    this.pArgs = Array.from(expr.matchAll(pArgReg), m => m[2]);
    this.rArgs = Array.from(expr.matchAll(rArgReg), m => m[2]);
    this.children = [];
  }

  recursivePolicyArgs(): string[] {
    let res = [];
    res.push(...this.pArgs);
    for (let child of this.children) {
      res.push(...child.recursivePolicyArgs());
    }
    return res;
  }

  recursiveRequestArgs(): string[] {
    let res = [];
    res.push(...this.rArgs);
    for (let child of this.children) {
      res.push(...child.recursiveRequestArgs());
    }
    return res;
  }

  isLeafNode(): boolean {
    return this.children.length === 0;
  }
}

function buildExprTree(
  expr: string,
  node: MatcherStage,
  ast: Expression,
  right: Expression[]
): void {
  if (ast.type === 'LogicalExpression' && ast.operator === '||') {
    buildExprTree(expr, node, ast.left, right);
    buildExprTree(expr, node, ast.right, right);
  } else if (ast.type === 'LogicalExpression' && ast.operator === '&&') {
    let rightCopy = Array.from(right);
    rightCopy.push(ast.right);
    buildExprTree(expr, node, ast.left, rightCopy);
  } else {
    let range = ast.range as [number, number];
    let nextNode = new MatcherStage(ast, expr.substring(range[0], range[1]));
    node.children.push(nextNode);
    let rightCopy = Array.from(right);
    let r = rightCopy.pop();
    if (r !== undefined) {
      buildExprTree(expr, nextNode, r, rightCopy);
    }
  }
}

class ExpressionError extends Error {}

export function buildIndex(expr: string): MatcherStage {
  let exprBody = parseScript(expr, { range: true }).body;
  if (exprBody.length > 1) {
    throw new ExpressionError('more than one expression found: ' + expr);
  }
  let ast = exprBody[0];
  if (ast.type !== 'ExpressionStatement') {
    throw new ExpressionError();
  }
  let root = new MatcherStage({} as Expression, '');
  buildExprTree(expr, root, ast.expression, []);
  return root;
}
