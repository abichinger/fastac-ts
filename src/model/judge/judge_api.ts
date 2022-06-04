import { ParameterDef } from '../def';

export enum Effect {
  Allow = 0,
  Indeterminate,
  Deny,
}

export interface Judgement {
  effect: Effect;
  matched?: string[];
}

export interface IJudgeFactory {
  getJudge(pDef: ParameterDef<string>): IJudge;
}

export interface IJudge {
  eval(rule: string[]): Judgement;
  finalize(): Judgement;
}
