import { IPatternMatcher } from '../model/static';
import { IDefaultRoleManager } from './rbac_api';
import { Role } from './role';

export class RoleManager implements IDefaultRoleManager {

    private roles: Map<string, Role>
    private patternRoles: Set<string>
    private maxHierarchyLevel: number
    private matcher: IPatternMatcher | undefined

    constructor(maxHierarchyLevel: number = 10, matcher: IPatternMatcher | undefined = undefined) {
        this.maxHierarchyLevel = maxHierarchyLevel
        this.matcher = matcher
        this.roles = new Map()
        this.patternRoles = new Set()
    }
    
    setRoleMatcher(matcher: IPatternMatcher | undefined): void {
        this.matcher = matcher
    }
    setDomainMatcher(_matcher: IPatternMatcher | undefined): void {
        return;
    }

    clear() {
        this.roles = new Map()
        this.patternRoles = new Set()
    }

    eachMatchingRole(pattern: string, cb: (role: Role) => void): void {
        let matcher = (this.matcher as IPatternMatcher);
        for (let [name, role] of this.roles.entries()) {
            if (pattern != name && matcher.match(name, matcher.parse(pattern))) {
                cb(role)
            }
        }
    }

    eachMatchingPattern(name: string, cb: (role: Role) => void): void {
        let matcher = (this.matcher as IPatternMatcher);
        for (let pattern of this.patternRoles.values()) {
            if (pattern != name && matcher.match(name, matcher.parse(pattern))) {
                let role = this.roles.get(pattern)
                cb(role as Role)
            }
        }
    }

    getRole(name: string): [Role, boolean] {
        let role = this.roles.get(name)
        if (role !== undefined) {
            return [role, false]
        }

        let newRole = new Role(name)
        this.roles.set(name, newRole)

        if (this.matcher !== undefined) {
            if (this.matcher.isPattern(name)) {
                this.patternRoles.add(name)
                this.eachMatchingRole(name, (r: Role) => {
                    newRole.addMatch(r)
                })
            } else {
                this.eachMatchingPattern(name, (r: Role) => {
                    r.addMatch(newRole)
                })
            }
        }

        return [newRole, true]
    }

    removeRole(name: string) {
        let role = this.roles.get(name)
        if (role === undefined) {
            return
        }
        this.roles.delete(name)
        this.patternRoles.delete(name)
        role.removeMatches()
    }

    addLink(user: string, role: string): boolean {
        let [userR] = this.getRole(user)
        let [roleR] = this.getRole(role)
        return userR.addRole(roleR)
    }

    deleteLink(user: string, role: string): boolean {
        let [userR] = this.getRole(user)
        let [roleR] = this.getRole(role)
        return userR.addRole(roleR)
    }

    hasLinkHelper(target: string, roles: Set<Role>, level: number): boolean {
        if (level <= 0 || roles.size == 0) {
            return false
        }

        let nextRoles = new Set<Role>()
        for (let role of roles) {
            if (target == role.name || this.matcher !== undefined && this.matcher.match(role.name, this.matcher.parse(target))) {
                return true
            }
            role.eachRole((r) => {
                nextRoles.add(r)
            })
        }

        return this.hasLinkHelper(target, nextRoles, level-1)
    }

    hasLink(user: string, role: string): boolean {
        if (user == role || this.matcher !== undefined && this.matcher.match(user, this.matcher.parse(role))) {
            return true
        } 

        let [userR, userCreated] = this.getRole(user)
        let [roleR, roleCreated] = this.getRole(role)
        let res = this.hasLinkHelper(roleR.name, new Set([userR]), this.maxHierarchyLevel)

        if (userCreated) {
            this.removeRole(user)
        }
        if (roleCreated) {
            this.removeRole(role)
        }
        return res
    }

    getRoles(user: string): string[] {
        let [userR, userCreated] = this.getRole(user)
        let res: string[] = []
        userR.eachRole((role) => {
            res.push(role.name)
        })
        if (userCreated) {
            this.removeRole(user)
        }
        return res
    }

    getUsers(role: string): string[] {
        let [roleR, roleCreated] = this.getRole(role)
        let res: string[] = []
        roleR.eachUser((role) => {
            res.push(role.name)
        })
        if (roleCreated) {
            this.removeRole(role)
        }
        return res
    }

    eachLinkHelper(users: Map<string, Role>, cb: (user: string, role: string, ...domain: string[]) => void) {
        for(let user of users.values()) {
            for(let roleName of user.roles.keys()) {
                cb(user.name, roleName)
            }
        }
    }

    eachLink(cb: (user: string, role: string, ...domain: string[]) => void): void {
        this.eachLinkHelper(this.roles, cb)
    }
}