import { IModel, Sec } from "./model_api"
import { EventEmitter } from "events"
import { getBaseKey, getProperty } from "../util";
import { DefHandler, GenericHandler, JudgeHandler, MatcherHandler, PolicyHandler, RoleManagerHandler } from "./handlers";

class Section {
    name: string
    defs: Map<string, string>
    handlers: Map<string, DefHandler<any>>

    constructor(name: string){
        this.name = name
        this.defs = new Map()
        this.handlers = new Map()
    }

    register(baseKey: string, handler: DefHandler<any>): void {
        this.handlers.set(baseKey, handler)
    }

    set(model: IModel, key: string, value: string){
        let baseKey = getBaseKey(key)
        let handler = this.handlers.get(baseKey)
        if (handler === undefined) {
            throw new Error(`no def handler found for '${key}'`)
        }
        let property = getProperty(key)
        if (property === undefined) {
            handler.add(model, key, value)
        } else {
            handler.prop(key, property, value)
        }
        this.defs.set(key, value)
    }

    remove(model: IModel, key: string){
        let baseKey = getBaseKey(key)
        let handler = this.handlers.get(baseKey)
        if (handler === undefined) {
            throw new Error(`no def handler found for '${key}'`)
        }
        handler.remove(model, key)
        this.defs.delete(key)
    }

    get<T>(key: string): T | undefined {
        let baseKey = getBaseKey(key)
        let handler = this.handlers.get(baseKey)
        if (handler === undefined) {
            return undefined
        }
        return (handler as DefHandler<T>).get(key)
    }

    getDef(key: string): string | undefined {
        return this.defs.get(key)
    }
}

export class Model extends EventEmitter implements IModel {

    secMap: Map<string, Section>

    constructor() {
        super()
        this.secMap = new Map()

        this.registerDef(Sec.R, "r", new GenericHandler())
        this.registerDef(Sec.P, "p", new PolicyHandler())
        this.registerDef(Sec.G, "g", new RoleManagerHandler())
        this.registerDef(Sec.J, "j", new JudgeHandler())
        this.registerDef(Sec.M, "m", new MatcherHandler())
    }

    registerDef(sec: string, keyPrefix: string, handler: DefHandler<any>): void {
        let section = this.secMap.get(sec)
        if(section === undefined) {
            section = new Section(sec)
            this.secMap.set(sec, section)
        }
        section.register(keyPrefix, handler)
    }

    get<T>(sec: string, key: string): T | undefined {
        let section = this.secMap.get(sec)
        if(section === undefined) {
            throw new Error(`section "${sec}" not found`)
        }
        return section.get<T>(key)
    }
    
    setDef(sec: string, key: string, value: string): void {
        let section = this.secMap.get(sec)
        if(section === undefined) {
            throw new Error(`section "${sec}" not found`)
        }
        section.set(this, key, value)
    }

    getDef(sec: string, key: string): string | undefined {
        let section = this.secMap.get(sec)
        if(section === undefined) {
            throw new Error(`section "${sec}" not found`)
        }
        return section.getDef(key)
    }

    removeDef(sec: string, key: string): void {
        let section = this.secMap.get(sec)
        if(section === undefined) {
            throw new Error(`section "${sec}" not found`)
        }
        section.remove(this, key)
    }

    addRule(rule: string[]): boolean {
        throw new Error("Method not implemented.");
    }
    removeRule(rule: string[]): boolean {
        throw new Error("Method not implemented.");
    }

    toString(): string {
        throw new Error("Method not implemented.");
    }
}