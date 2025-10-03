import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessions = await query<any[]>(
      `SELECT 
        cs.id,
        cs.title,
        cs.created_at,
        cs.updated_at,
        COUNT(ch.id) as messageCount
      FROM chat_sessions cs
      LEFT JOIN chat_history ch ON cs.id = ch.session_id
      WHERE cs.user_id = ?
      GROUP BY cs.id
      ORDER BY cs.updated_at DESC
      LIMIT 50`,
      [session.user.id],
    )

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Sessions fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}
