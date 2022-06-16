import matchit from 'matchit';
import { regexMatcher } from './matchers';
import staticEval from 'static-eval';
import { parseScript } from 'esprima';
import { Expression } from 'estree';

export function pathMatch(path: string, pattern: string): boolean {
  let pathPattern = matchit.parse(pattern);
  let match = matchit.match(path, [pathPattern]);
  return match.length > 0;
}

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

export function evaluate(expr: string, vars: any): any {
  return staticEval(parse(expr), vars);
}
