import { JudgeFactory } from "./model/judge"
import { IMatcher } from "./model/matcher/matcher_api"
import { IModel } from "./model/model_api"

interface BaseConfig {
	req?: any[]
	matcher?: string | IMatcher
} 

interface EnforceConfig extends BaseConfig {
	judge?: string | JudgeFactory
}

export interface IEnforcer {
    getModel(): IModel
	setModel(model: IModel): void

    addRule(rule: string[]): boolean
	addRules(rules: string[][]): void
	removeRule(rule: string[]): boolean
	removeRules(rules: string[][]): void

    enforce(config: EnforceConfig): boolean
	filter(config: BaseConfig): string[][]
	eachMatch(config: BaseConfig, cb: (rule: string[]) => boolean): void
}