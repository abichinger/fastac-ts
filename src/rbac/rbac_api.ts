import { IPatternMatcher } from '../util';

export interface IRoleManager {
  clear(): void;
  addLink(user: string, role: string, ...domain: string[]): boolean;
  deleteLink(user: string, role: string, ...domain: string[]): boolean;
  hasLink(user: string, role: string, ...domain: string[]): boolean;
  getRoles(user: string, ...domain: string[]): string[];
  getUsers(role: string, ...domain: string[]): string[];
}

export interface IDefaultRoleManager extends IRoleManager {
  setRoleMatcher(matcher: IPatternMatcher | undefined): void;
  setDomainMatcher(matcher: IPatternMatcher | undefined): void;
  eachLink(cb: (user: string, role: string, ...domain: string[]) => void): void;
}
