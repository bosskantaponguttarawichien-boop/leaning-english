import liff from "@line/liff"

const LIFF_ID = "2009451557-lZpkB3ag"

export type LiffProfile = {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

let initialized = false

export async function initLiff(): Promise<void> {
  if (initialized) return
  await liff.init({ liffId: LIFF_ID })
  initialized = true
}

export async function getLiffProfile(): Promise<LiffProfile> {
  return await liff.getProfile()
}

export function isLiffLoggedIn(): boolean {
  return liff.isLoggedIn()
}

export function liffLogin(): void {
  liff.login()
}

export function liffLogout(): void {
  liff.logout()
}
