import { IPolicy } from './policy_api'
import { EventEmitter } from 'events'
import { hash } from '../../util';

export class Policy extends EventEmitter implements IPolicy {

    rules: Map<string, string[]>

    constructor() {
        super()
        this.rules = new Map()
    }
    
    addRule(rule: string[]): boolean {
        let key = hash(rule)
        if (this.rules.has(key)) {
            return false
        }
        this.rules.set(key, rule)
        this.emit('rule_added', rule)
        return true
    }
    removeRule(rule: string[]): boolean {
        let key = hash(rule)
        if (!this.rules.has(key)) {
            return false
        }
        this.rules.delete(key)
        this.emit('rule_deleted', rule)
        return true
    }
    clear(): void {
        this.rules = new Map()
        this.emit('cleared')
    }
    [Symbol.iterator](): Iterator<string[], any, undefined> {
        return this.rules.values()
    }
}