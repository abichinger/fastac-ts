import { PType, ParamTypes } from './static/param_types';

export class ParameterDef {
  key: string;
  params: string[];
  paramTypes: PType[];
  paramIndex: Map<string, number>;

  constructor(key: string, parameters: string, defaultType: string = 'String') {
    this.key = key;
    this.params = [];
    this.paramTypes = [];
    this.paramIndex = new Map();

    for (let [i, p] of parameters.split(',').entries()) {
      let param = p.trim();
      let type = defaultType;
      let typeIndex = p.indexOf(':');
      if (typeIndex >= 0) {
        param = p.slice(0, typeIndex).trim();
        type = p.slice(typeIndex + 1).trim();
      }
      let pType = ParamTypes.get(type);
      if (pType === undefined) {
        throw new Error(`${parameters}, unknown type ${type}`);
      }
      this.params.push(param);
      this.paramTypes.push(pType);
      this.paramIndex.set(param, i);
    }
  }

  get(args: any, name: string): any {
    let index = this.paramIndex.get(name);
    if (index === undefined) {
      throw new Error(`parameter '${name}' not found`);
    }
    //check if rule is passed with key
    if (args.length - 1 === this.params.length) {
      index++;
    }
    if (index > args.length) {
      throw new Error(`rule has not enough values`);
    }
    return args[index];
  }

  has(name: string): boolean {
    return this.paramIndex.has(name);
  }

  getArray(args: any[], names: string[]): any[] {
    return names.map(name => this.get(args, name));
  }

  toObject(args: any[]): any {
    let obj = args.reduce((acc, arg, i) => {
      acc[this.params[i]] = arg;
      return acc;
    }, {} as any);
    return {
      [this.key]: obj,
    };
  }

  parse(rule: string[]): any[] {
    let offset = rule.length - this.paramTypes.length;
    let res = this.paramTypes.map((type, i) => {
      return type.parse(rule[i + offset]);
    });
    if (offset > 0) {
      res.unshift(rule[0]);
    }
    return res;
  }

  stringify(rule: any[]): string[] {
    let offset = rule.length - this.paramTypes.length;
    let res = this.paramTypes.map((type, i) => {
      return type.stringify(rule[i + offset]);
    });
    if (offset > 0) {
      res.unshift(rule[0]);
    }
    return res;
  }

  check(rule: any[]): void {
    let offset = rule.length - this.paramTypes.length;
    this.paramTypes.map((type, i) => {
      return type.check(rule[i + offset]);
    });
  }
}
