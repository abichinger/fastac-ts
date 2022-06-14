import { IPatternMatcher } from '../model/static';
import { IDefaultRoleManager } from './rbac_api';
import { RoleManager } from './role_manager';

const defaultDomain = 'RoleManager';

export class DomainManager implements IDefaultRoleManager {
  private rmMap: Map<string, IDefaultRoleManager>;
  private patterns: Set<string>;
  private maxHierarchyLevel: number;
  private domainMatcher?: IPatternMatcher;
  private roleMatcher?: IPatternMatcher;

  constructor(
    maxHierarchyLevel: number = 10,
    domainMatcher?: IPatternMatcher,
    roleMatcher?: IPatternMatcher
  ) {
    this.maxHierarchyLevel = maxHierarchyLevel;
    this.domainMatcher = domainMatcher;
    this.roleMatcher = roleMatcher;
    this.rmMap = new Map();
    this.patterns = new Set();
  }

  setRoleMatcher(matcher: IPatternMatcher | undefined): void {
    this.roleMatcher = matcher;
  }
  setDomainMatcher(matcher: IPatternMatcher | undefined): void {
    this.domainMatcher = matcher;
  }

  clear() {
    this.rmMap = new Map();
    this.patterns = new Set();
  }

  eachMatchingRm(pattern: string, cb: (rm: IDefaultRoleManager) => void) {
    let matcher = this.domainMatcher as IPatternMatcher;
    for (let [domain, rm] of this.rmMap.entries()) {
      if (pattern !== domain && matcher.match(domain, matcher.parse(pattern))) {
        cb(rm);
      }
    }
  }

  eachMatchingPattern(domain: string, cb: (rm: IDefaultRoleManager) => void) {
    let matcher = this.domainMatcher as IPatternMatcher;
    for (let pattern of this.patterns.values()) {
      if (pattern !== domain && matcher.match(domain, matcher.parse(pattern))) {
        let rm = this.rmMap.get(pattern);
        cb(rm as IDefaultRoleManager);
      }
    }
  }

  getDomain(domains: string[]): [string, string[]] {
    if (domains.length === 0) {
      return [defaultDomain, []];
    }
    return [domains[0], domains.slice(1)];
  }

  getRoleManager(domain: string, store: boolean): IDefaultRoleManager {
    let rm = this.rmMap.get(domain);
    if (rm !== undefined) {
      return rm;
    }
    if (domain !== defaultDomain) {
      rm = new DomainManager(
        this.maxHierarchyLevel - 1,
        this.domainMatcher,
        this.roleMatcher
      );
    } else {
      rm = new RoleManager(this.maxHierarchyLevel - 1, this.roleMatcher);
    }
    if (rm && store) {
      this.rmMap.set(domain, rm);
    }
    if (this.domainMatcher !== undefined) {
      if (this.domainMatcher.isPattern(domain)) {
        this.patterns.add(domain);
      } else {
        this.eachMatchingPattern(domain, rm2 => {
          rm2.eachLink((user, role, ...domain) => {
            rm?.addLink(user, role, ...domain);
          });
        });
      }
    }
    return rm;
  }

  addLink(user: string, role: string, ...domains: string[]): boolean {
    let [domain, subdomains] = this.getDomain(domains);
    let rm = this.getRoleManager(domain, true);
    let added = rm.addLink(user, role, ...subdomains);

    if (this.domainMatcher && this.domainMatcher.isPattern(domain)) {
      this.eachMatchingRm(domain, rm2 => {
        rm2.addLink(user, role, ...subdomains);
      });
    }
    return added;
  }

  deleteLink(user: string, role: string, ...domains: string[]): boolean {
    let [domain, subdomains] = this.getDomain(domains);
    let rm = this.getRoleManager(domain, true);
    let deleted = rm.deleteLink(user, role, ...subdomains);

    if (this.domainMatcher && this.domainMatcher.isPattern(domain)) {
      this.eachMatchingRm(domain, rm2 => {
        rm2.deleteLink(user, role, ...subdomains);
      });
    }
    return deleted;
  }

  hasLink(user: string, role: string, ...domains: string[]): boolean {
    let [domain, subdomains] = this.getDomain(domains);
    let rm = this.getRoleManager(domain, true);
    return rm.hasLink(user, role, ...subdomains);
  }

  getRoles(user: string, ...domains: string[]): string[] {
    let [domain, subdomains] = this.getDomain(domains);
    let rm = this.getRoleManager(domain, true);
    return rm.getRoles(user, ...subdomains);
  }

  getUsers(role: string, ...domains: string[]): string[] {
    let [domain, subdomains] = this.getDomain(domains);
    let rm = this.getRoleManager(domain, true);
    return rm.getUsers(role, ...subdomains);
  }

  eachLinkHelper(
    rmMap: Map<string, IDefaultRoleManager>,
    cb: (user: string, role: string, ...domain: string[]) => void
  ) {
    for (let [domain, rm] of rmMap.entries()) {
      let dom = domain !== defaultDomain ? domain : undefined;

      rm.eachLink((user, role, ...domains) => {
        domains = domains.slice();
        if (dom) {
          domains.unshift(dom);
        }
        cb(user, role, ...domains);
      });
    }
  }

  eachLink(cb: (user: string, role: string, ...domain: string[]) => void) {
    this.eachLinkHelper(this.rmMap, cb);
  }
}
