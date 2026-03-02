import type { AbilityEntry, AbilityId } from './abilityCatalog.js'

type SessionKey = string

type SessionState = {
  loadedAbilities: Map<AbilityId, string[]>
  activeToolNames: Set<string>
}

export class SessionAbilityState {
  private sessions = new Map<SessionKey, SessionState>()
  private static DEFAULT_KEY: SessionKey = '__default__'

  private key(sessionId: string | undefined): SessionKey {
    return sessionId || SessionAbilityState.DEFAULT_KEY
  }

  private getOrCreate(sessionId: string | undefined): SessionState {
    const k = this.key(sessionId)
    const existing = this.sessions.get(k)
    if (existing)
      return existing
    const st: SessionState = {
      loadedAbilities: new Map(),
      activeToolNames: new Set(),
    }
    this.sessions.set(k, st)
    return st
  }

  loadAbility(sessionId: string | undefined, ability: AbilityEntry): { newTools: string[] } {
    const st = this.getOrCreate(sessionId)
    if (st.loadedAbilities.has(ability.id))
      return { newTools: [] }

    const newTools: string[] = []
    for (const t of ability.toolNames) {
      if (!st.activeToolNames.has(t))
        newTools.push(t)
      st.activeToolNames.add(t)
    }
    st.loadedAbilities.set(ability.id, ability.toolNames.slice())
    return { newTools }
  }

  unloadAbility(sessionId: string | undefined, ability: AbilityEntry): { removedTools: string[] } {
    const st = this.getOrCreate(sessionId)
    if (!st.loadedAbilities.has(ability.id))
      return { removedTools: [] }

    st.loadedAbilities.delete(ability.id)

    const prev = new Set(st.activeToolNames)
    const next = new Set<string>()
    for (const toolNames of st.loadedAbilities.values()) {
      for (const t of toolNames)
        next.add(t)
    }
    st.activeToolNames = next

    const removedTools: string[] = []
    for (const t of prev) {
      if (!next.has(t))
        removedTools.push(t)
    }
    return { removedTools }
  }

  getActiveToolNames(sessionId: string | undefined): Set<string> {
    return new Set(this.getOrCreate(sessionId).activeToolNames)
  }

  getLoadedAbilityIds(sessionId: string | undefined): Set<AbilityId> {
    return new Set(this.getOrCreate(sessionId).loadedAbilities.keys())
  }

  isToolActive(sessionId: string | undefined, toolName: string): boolean {
    return this.getOrCreate(sessionId).activeToolNames.has(toolName)
  }

  cleanup(sessionId: string | undefined): void {
    const k = this.key(sessionId)
    this.sessions.delete(k)
  }
}

