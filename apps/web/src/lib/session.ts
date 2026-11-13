// Wallet login session token is stored in sessionStorage (cleared when the tab is closed).
// All access is wrapped in try/catch to gracefully handle environments where storage is disabled.
const KEY = 'elysia_session'

/** sessionStorage does not trigger storage events in the same tab; other components listen to this event. */
export const SESSION_EVENT = 'elysia-session'
const announce = () => {
  window.dispatchEvent(new Event(SESSION_EVENT))
}

/** Account status changed (e.g. Pro freshly activated): wallet button reloads account data. */
export const ME_CHANGED_EVENT = 'elysia-me-changed'
export const announceMeChanged = () => {
  window.dispatchEvent(new Event(ME_CHANGED_EVENT))
}

export function getToken(): string | null {
  try {
    return window.sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    window.sessionStorage.setItem(KEY, token)
  } catch {
    /* without storage: session persists only while page stays open */
  }
  announce()
}

export function clearToken(): void {
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  announce()
}
