import { TestLifecycle } from '../test/enforcer.test';
import { guard } from '@ucast/mongo2js';
import { ParamTypes, PType } from '../src/model/static/param_types';

class UcastGuard {
  jsonStr: string;
  guard: any;

  constructor(str: string, guard: any) {
    this.jsonStr = str;
    this.guard = guard;
  }

  test(obj: any): boolean {
    return this.guard(obj);
  }

  static fromStr(str: any): UcastGuard {
    let obj = JSON.parse(str);
    return new UcastGuard(str, guard(obj));
  }

  toString(): string {
    return this.jsonStr;
  }
}

class UcastGuardParser implements PType {
  parse(str: string): UcastGuard {
    return UcastGuard.fromStr(str);
  }
  stringify(obj: any): string {
    return obj.toString();
  }
  check(obj: any): void {
    let isGuard =
      obj !== null && typeof obj === 'object' && typeof obj.test === 'function';
    if (!isGuard) {
      throw new Error(`${obj} is not a ucast guard`);
    }
  }
}

export class UcastSetup implements TestLifecycle {
  before(): void {
    ParamTypes.set('Ucast', new UcastGuardParser());
  }
  after(): void {
    return;
  }
}
