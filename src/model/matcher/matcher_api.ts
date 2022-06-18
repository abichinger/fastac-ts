import { ParameterDef } from '../def';

/** @see {isMatcher} ts-auto-guard:type-guard */
export interface IMatcher {
  eachMatch(req: any[], fn: (rule: string[]) => boolean): void;
  getPolicyDef(): ParameterDef;
}
