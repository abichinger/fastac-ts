
export class ParameterDef<ParamType> {
    
    key: string
    params: string[]
    paramIndex: Map<string, number>

    constructor(key:string , parameters: string) {
        this.key = key
        this.params = parameters.split(",").map(p => p.trim())
        this.paramIndex = new Map()
        for (let [i, param] of this.params.entries()) {
            this.paramIndex.set(param, i)
        }
    }

    get(args: ParamType[], name: string): ParamType {
        let index = this.paramIndex.get(name)
        if (index === undefined) {
            throw new Error(`parameter '${name}' not found`) 
        }
        //check if rule is passed with key
        if (args.length - 1 == this.params.length) {
            index++
        }
        if (index > args.length) {
            throw new Error(`rule has not enough values`)
        }
        return args[index]
    }

    has(name: string): boolean {
        return this.paramIndex.has(name)
    }

    getArray(args: ParamType[], names: string[]): ParamType[] {
        return names.map(name => this.get(args, name))
    }

    toObject(args: ParamType[]): any {
        let obj = args.reduce((acc, arg, i) => {
            acc[this.params[i]] = arg
            return acc
        }, {} as any)
        return {
            [this.key]: obj
        } 
    }
}
