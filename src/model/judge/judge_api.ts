import { ParameterDef } from "../def"

export enum Effect {
    Allow = 0,
    Indeterminate,
    Deny,
}

export interface Judgement {
    effect: Effect,
    matched?: string[]
}

export interface IJudgeFactory {
    getJudge(): IJudge
}

export interface IJudge {
    eval(rule: string[], pDef: ParameterDef<string>): Judgement
    finalize(): Judgement
}