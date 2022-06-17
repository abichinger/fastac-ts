import { parse } from './functions';
import { Expression } from 'estree';
import staticEval from 'static-eval';
import matchit from 'matchit';

export interface PType {
  parse(str: string): any;
  stringify(obj: any): string;
  check(obj: any): void;
}

class PTypeAny implements PType {
  parse(str: any) {
    return str;
  }
  stringify(obj: any): string {
    return obj.toString();
  }
  check(): void {
    return;
  }
}

class PTypeStr implements PType {
  parse(str: string) {
    return str;
  }
  stringify(obj: any): string {
    return obj;
  }
  check(obj: any): void {
    if (typeof obj !== 'string') {
      throw new Error(`${obj} is not a string`);
    }
  }
}

class PTypeInt implements PType {
  parse(str: string): number {
    return parseInt(str);
  }
  stringify(n: number): string {
    return n + '';
  }
  check(n: number): void {
    if (typeof n !== 'number') {
      throw new Error(`${n} is not a number`);
    }
  }
}

class RegexParser implements PType {
  parse(str: string): any {
    return RegExp(str);
  }
  stringify(obj: any): string {
    return obj.toString();
  }
  check(obj: any): void {
    let isReg =
      obj !== null &&
      typeof obj === 'object' &&
      typeof obj.exec === 'function' &&
      typeof obj.test === 'function';
    if (!isReg) {
      throw new Error(`${obj} is not a regular expression`);
    }
  }
}

class EvaluableExpression {
  expr: string;
  ast: Expression;

  constructor(expr: string, ast: Expression) {
    this.expr = expr;
    this.ast = ast;
  }

  eval(vars: any) {
    return staticEval(this.ast, vars);
  }

  toString(): string {
    return this.expr;
  }

  static fromString(str: string): EvaluableExpression {
    return new EvaluableExpression(str, parse(str));
  }
}

class ExpressionParser implements PType {
  parse(str: string): EvaluableExpression {
    return EvaluableExpression.fromString(str);
  }
  stringify(obj: any): string {
    return obj.toStirng();
  }
  check(obj: any): void {
    let isExpr =
      obj !== null && typeof obj === 'object' && typeof obj.eval === 'function';
    if (!isExpr) {
      throw new Error(`${obj} is not an evaluabe expression`);
    }
  }
}

class Path {
  str: string;
  pattern: matchit.Route;

  constructor(pattern: string) {
    this.str = pattern;
    this.pattern = matchit.parse(pattern);
  }

  match(path: string): boolean {
    let match = matchit.match(path, [this.pattern]);
    return match.length > 0;
  }

  toString(): string {
    return this.str;
  }
}

class PTypePath implements PType {
  parse(str: string): Path {
    return new Path(str);
  }
  stringify(path: Path): string {
    return path.toString();
  }
  check(path: Path): void {
    let isPath =
      path !== null &&
      typeof path === 'object' &&
      typeof path.match === 'function';
    if (!isPath) {
      throw new Error(`${path} is not a path pattern`);
    }
  }
}

let ParamTypes = new Map<string, PType>();
ParamTypes.set('Any', new PTypeAny());
ParamTypes.set('String', new PTypeStr());
ParamTypes.set('Int', new PTypeInt());
ParamTypes.set('Regex', new RegexParser());
ParamTypes.set('Expr', new ExpressionParser());
ParamTypes.set('Path', new PTypePath());

export { ParamTypes };
