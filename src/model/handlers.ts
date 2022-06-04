import { DomainManager } from '../rbac/domain_manager';
import { IDefaultRoleManager } from '../rbac/rbac_api';
import { RoleManager } from '../rbac/role_manager';
import { RolePolicy } from '../rbac/role_policy';
import { ParameterDef } from './def';
import { JudgeFactory } from './judge';
import { buildIndex, Matcher, policyKey, reqKey } from './matcher';
import { IModel, Sec } from './model_api';
import { Policy } from './policy/policy';
import { IPolicy } from './policy/policy_api';
import { getPatternMatcher, removeFunction, setFunction } from './static';

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

export abstract class DefHandler<T> {
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

  registerProp(name: string, handler: (instance: T, value: string) => void) {
    this.propHandlers.set(name, handler);
  }
}

function getRequestDef(m: IModel, key?: string): ParameterDef<any> {
  if (key === undefined) {
    return new ParameterDef<any>('', '');
  }
  let args = m.getDef(Sec.R, key);
  if (args === undefined) {
    throw new Error(`request definition '${key}' not found`);
  }
  return new ParameterDef<any>(key, args);
}

function getPolicyDef(m: IModel, key?: string): ParameterDef<string> {
  if (key === undefined) {
    return new ParameterDef<string>('', '');
  }
  let args = m.getDef(Sec.P, key);
  if (args === undefined) {
    throw new Error(`policy definition '${key}' not found`);
  }
  return new ParameterDef<string>(key, args);
}

export class PolicyHandler extends DefHandler<Policy> {
  create(): Policy {
    return new Policy();
  }
  destroy(): void {}
}

export class MatcherHandler extends DefHandler<Matcher> {
  create({ m, value: expr }: CreateProps): Matcher {
    let exprRoot = buildIndex(expr);
    let pKey = policyKey(expr);
    let rKey = reqKey(expr);

    let rDef = getRequestDef(m, rKey);
    let pDef = getPolicyDef(m, pKey);

    let policy: IPolicy | undefined = undefined;
    if (pKey) {
      policy = m.get<IPolicy>(Sec.P, pKey);
      policy = policy ? policy : m.get<IPolicy>(Sec.G, pKey);
      if (policy === undefined) {
        throw new Error(`policy '${pKey}' not found`);
      }
    }

    return new Matcher(rDef, pDef, policy, exprRoot);
  }
  destroy({ instance: matcher }: DestroyProps<Matcher>): void {
    if (matcher === undefined) {
      return;
    }
    matcher.disable();
  }
}

export class RoleManagerHandler extends DefHandler<RolePolicy> {
  constructor() {
    super();
    this.registerProp('roleMatcher', (rolePolicy, value) => {
      let matcher = getPatternMatcher(value);
      if (matcher === undefined) {
        throw new Error(
          `PatternMatcher '${value}' not found, use setPatternMatcher to register a new matcher`
        );
      }
      (rolePolicy.rm as IDefaultRoleManager).setRoleMatcher(matcher);
    });
    this.registerProp('domainMatcher', (rolePolicy, value) => {
      let matcher = getPatternMatcher(value);
      if (matcher === undefined) {
        throw new Error(
          `PatternMatcher '${value}' not found, use setPatternMatcher to register a new matcher`
        );
      }
      (rolePolicy.rm as IDefaultRoleManager).setDomainMatcher(matcher);
    });
  }

  create({ key, value }: CreateProps): RolePolicy {
    let def = new ParameterDef<string>(key, value);
    if (def.params.length <= 1) {
      throw new Error(`expected at least 2 parameters (${key} = ${value})`);
    }
    let rm: IDefaultRoleManager;
    if (def.params.length === 2) {
      rm = new RoleManager(10);
    } else {
      rm = new DomainManager(10);
    }

    setFunction(key, rm.hasLink.bind(rm));
    return new RolePolicy(rm);
  }

  destroy({ key }: DestroyProps<RolePolicy>): void {
    removeFunction(key);
  }
}

export class JudgeHandler extends DefHandler<JudgeFactory> {
  create({ value }: CreateProps): JudgeFactory {
    return new JudgeFactory(value);
  }
  destroy(): void {}
}

export class GenericHandler extends DefHandler<undefined> {
  create(): undefined {
    return;
  }
  destroy(): void {}
}
