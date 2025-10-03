import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessionId = Number.parseInt(params.id)

    const messages = await query(
      `SELECT * FROM chat_history 
      WHERE session_id = ? AND user_id = ?
      ORDER BY created_at ASC`,
      [sessionId, session.user.id],
    )

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Session fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessionId = Number.parseInt(params.id)

    await query(`DELETE FROM chat_sessions WHERE id = ? AND user_id = ?`, [sessionId, session.user.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Session delete error:", error)
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
  }
}
