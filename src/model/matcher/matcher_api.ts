import { IPolicy } from '../policy/policy_api';

/** @see {isMatcher} ts-auto-guard:type-guard */
export interface IMatcher {
  eachMatch(req: any[], fn: (rule: any[]) => boolean): void;
  getPolicy(): IPolicy;
}
