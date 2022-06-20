import { DomainManager } from '../rbac/domain_manager';
import { IDefaultRoleManager } from '../rbac/rbac_api';
import { RoleManager } from '../rbac/role_manager';
import { RolePolicy } from '../rbac/role_policy';
import { ParameterDef } from './def';
import { JudgeFactory } from './judge';
import { IJudgeFactory } from './judge/judge_api';
import { buildIndex, Matcher, policyKey, reqKey } from './matcher';
import { IMatcher } from './matcher/matcher_api';
import { IModel, Sec } from './model_api';
import { Policy } from './policy/policy';
import { IPolicy } from './policy/policy_api';
import { getPatternMatcher, removeFunction, setFunction } from './static';

export enum RetType {
  Param = 'param',
  Policy = 'policy',
  Matcher = 'Matcher',
  Judge = 'judge',
  Undefined = '',
}

export interface CreateProps {
  m: IModel;
  key: string;
  value: string;
}

export interface DestroyProps<T> {
  m: IModel;
  key: string;
  instance: T | undefined;
}

export interface IModelExtension {
  new ():
    | ModelExtension<ParameterDef>
    | ModelExtension<IPolicy>
    | ModelExtension<IMatcher>
    | ModelExtension<IJudgeFactory>
    | ModelExtension<undefined>;
}

export abstract class ModelExtension<T> {
  private propHandlers: Map<string, (instance: T, value: string) => void>;
  instances: Map<string, T>;

  constructor() {
    this.propHandlers = new Map();
    this.instances = new Map();
  }

  add(m: IModel, key: string, value: string) {
    let instance = this.create({ m, key, value });
    if (instance !== undefined) {
      this.instances.set(key, instance);
    }
  }

  remove(m: IModel, key: string) {
    this.destroy({ m, key, instance: this.get(key) });
    this.instances.delete(key);
  }

  abstract create(props: CreateProps): T;
  abstract destroy(props: DestroyProps<T>): void;
  abstract type(): RetType;

  prop(key: string, name: string, value: string) {
    let propHandler = this.propHandlers.get(name);
    if (propHandler === undefined) {
      throw new Error(
        `no handler found for property '${name}' (${key}.${name})`
      );
    }
    let instance = this.get(key);
    if (instance === undefined) {
      throw new Error(
        `can't set property ${name} of undefined (${key}.${name})`
      );
    }
    propHandler(instance, value);
  }

  get(key: string): T | undefined {
    return this.instances.get(key);
  }

  entries(): IterableIterator<[string, T]> {
    return this.instances.entries();
  }

  registerProp(name: string, handler: (instance: T, value: string) => void) {
    this.propHandlers.set(name, handler);
  }
}

export class PolicyHandler extends ModelExtension<IPolicy> {
  create({ key, value }: CreateProps): IPolicy {
    return new Policy(key, value);
  }
  destroy(): void {}
  type(): RetType {
    return RetType.Policy;
  }
}

export class MatcherHandler extends ModelExtension<IMatcher> {
  create({ m, value: expr }: CreateProps): IMatcher {
    let exprRoot = buildIndex(expr);
    let pKey = policyKey(expr);
    let rKey = reqKey(expr);

    let rDef = rKey ? m.get<ParameterDef>(RetType.Param, rKey) : undefined;

    let policy: IPolicy;
    if (pKey) {
      let p = m.get<IPolicy>(RetType.Policy, pKey);
      if (p === undefined) {
        throw new Error(`policy '${pKey}' not found`);
      }
      policy = p;
    } else {
      policy = new Policy('', '');
    }

    return new Matcher(rDef, policy, exprRoot);
  }
  destroy({ instance: matcher }: DestroyProps<Matcher>): void {
    if (matcher === undefined) {
      return;
    }
    matcher.disable();
  }
  type(): RetType {
    return RetType.Matcher;
  }
}

export class RoleManagerHandler extends ModelExtension<IPolicy> {
  constructor() {
    super();
    this.registerProp('roleMatcher', (rolePolicy, value) => {
      let matcher = getPatternMatcher(value);
      if (matcher === undefined) {
        throw new Error(
          `PatternMatcher '${value}' not found, use setPatternMatcher to register a new matcher`
        );
      }
      ((rolePolicy as RolePolicy).rm as IDefaultRoleManager).setRoleMatcher(
        matcher
      );
    });
    this.registerProp('domainMatcher', (rolePolicy, value) => {
      let matcher = getPatternMatcher(value);
      if (matcher === undefined) {
        throw new Error(
          `PatternMatcher '${value}' not found, use setPatternMatcher to register a new matcher`
        );
      }
      ((rolePolicy as RolePolicy).rm as IDefaultRoleManager).setDomainMatcher(
        matcher
      );
    });
  }

  create({ key, value }: CreateProps): IPolicy {
    let def = new ParameterDef(key, value);
    if (def.params.length <= 1) {
      throw new Error(`expected at least 2 parameters (${key} = ${value})`);
    }
    let rm: IDefaultRoleManager;
    if (def.params.length === 2) {
      rm = new RoleManager(10);
    } else {
      rm = new DomainManager(10);
    }

    setFunction(key + 'HasLink', rm.hasLink.bind(rm));
    return new RolePolicy(rm, key, value);
  }

  destroy({ key }: DestroyProps<IPolicy>): void {
    removeFunction(key);
  }

  type(): RetType {
    return RetType.Policy;
  }
}

export class JudgeHandler extends ModelExtension<IJudgeFactory> {
  create({ value }: CreateProps): IJudgeFactory {
    return new JudgeFactory(value);
  }
  destroy(): void {}
  type(): RetType {
    return RetType.Judge;
  }
}

export class ParameterHandler extends ModelExtension<ParameterDef> {
  create({ key, value }: CreateProps): ParameterDef {
    return new ParameterDef(key, value);
  }
  destroy(): void {}
  type(): RetType {
    return RetType.Param;
  }
}

export interface ExtensionEntry {
  sec: string;
  key: string;
  ext: IModelExtension;
}

let extensions: ExtensionEntry[] = [];

export function registerModelExtension(
  sec: string,
  key: string,
  ext: IModelExtension
) {
  extensions.push({ sec, key, ext });
}

registerModelExtension(Sec.R, 'r', ParameterHandler);
registerModelExtension(Sec.P, 'p', PolicyHandler);
registerModelExtension(Sec.G, 'g', RoleManagerHandler);
registerModelExtension(Sec.J, 'j', JudgeHandler);
registerModelExtension(Sec.M, 'm', MatcherHandler);

export { extensions };
