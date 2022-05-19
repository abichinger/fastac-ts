
class Role {

    name: string
    roles: Map<string, Role>
    users: Map<string, Role>
    private matches:  Map<string, Role>
    private matchedBy:  Map<string, Role>

    constructor(name: string) {
        this.name = name
        this.roles = new Map()
        this.users = new Map()
        this.matches = new Map()
        this.matchedBy = new Map()
    }

    hasRole(role: Role): boolean {
        return this.roles.has(role.name)
    }

    addRole(role: Role): boolean {
        if (this.hasRole(role)) {
            return false
        }
        this.roles.set(role.name, role)
        role.users.set(this.name, this)
        return true
    }

    removeRole(role: Role): boolean {
        if (!this.hasRole(role)) {
            return false
        }
        this.roles.delete(role.name)
        role.users.delete(this.name)
        return true
    }

    addMatch(role: Role) {
        this.matches.set(role.name, role)
        role.matchedBy.set(this.name, this)
    }

    removeMatch(role: Role) {
        this.matches.delete(role.name)
        role.matchedBy.delete(this.name)
    }

    removeMatches() {
        for(let m of this.matches.values()) {
            this.removeMatch(m)
        }
    }

    eachRole(cb: (role: Role) => void): void {
        for (let role of this.roles.values()) {
            cb(role)
            for(let m of role.matches.values()) {
                cb(m)
            }
        }
        for (let mb of this.matchedBy.values()) {
            for(let role of mb.roles.values()){
                cb(role)
            }
        }
    }

    eachUser(cb: (user: Role) => void): void {
        for (let user of this.users.values()) {
            cb(user)
            for(let m of user.matches.values()) {
                cb(m)
            }
        }
        for (let mb of this.matchedBy.values()) {
            for(let user of mb.users.values()){
                cb(user)
            }
        }
    }

}