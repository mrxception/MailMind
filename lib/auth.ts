import { cookies } from "next/headers"
import { query } from "./db"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

export interface User {
  id: number
  email: string
  name: string | null
}

export interface Session {
  id: string
  user_id: number
  expires_at: Date
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateSessionId(): string {
  return randomBytes(32).toString("hex")
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [sessionId, userId, expiresAt])

  return sessionId
}

export async function getSession(): Promise<{ user: User } | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value

  if (!sessionId) {
    return null
  }

  const sessions = await query<Session[]>("SELECT * FROM sessions WHERE id = ? AND expires_at > NOW()", [sessionId])

  if (sessions.length === 0) {
    return null
  }

  const session = sessions[0]
  const users = await query<User[]>("SELECT id, email, name FROM users WHERE id = ?", [session.user_id])

  if (users.length === 0) {
    return null
  }

  return { user: users[0] }
}

export async function setSessionCookie(sessionId: string) {
  const cookieStore = await cookies()
  cookieStore.set("session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value

  if (sessionId) {
    await query("DELETE FROM sessions WHERE id = ?", [sessionId])
    cookieStore.delete("session")
  }
}
