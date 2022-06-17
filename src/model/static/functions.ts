import { regexMatcher } from './matchers';
import { parseScript } from 'esprima';
import { Expression } from 'estree';

export function regexMatch(str: string, pattern: string): boolean {
  return regexMatcher.match(str, regexMatcher.parse(pattern));
}

class ExpressionError extends Error {}

export function parse(expr: string): Expression {
  let exprBody = parseScript(expr, { range: true }).body;
  if (exprBody.length > 1) {
    throw new ExpressionError('more than one expression found: ' + expr);
  }
  let ast = exprBody[0];
  if (ast.type !== 'ExpressionStatement') {
    throw new ExpressionError();
  }
  return ast.expression;
}
