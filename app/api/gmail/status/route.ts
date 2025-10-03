import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const connections = await query<any[]>(
      "SELECT gmail_email, connected_at FROM gmail_connections WHERE user_id = ? ORDER BY connected_at DESC LIMIT 1",
      [session.user.id],
    )

    if (connections.length === 0) {
      return NextResponse.json({ connected: false })
    }

    const emailCount = await query<any[]>("SELECT COUNT(*) as count FROM emails WHERE user_id = ?", [session.user.id])

    return NextResponse.json({
      connected: true,
      email: connections[0].gmail_email,
      connectedAt: connections[0].connected_at,
      emailCount: emailCount[0].count,
    })
  } catch (error) {
    console.error("Gmail status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
