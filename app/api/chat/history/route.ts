import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const history = await query<any[]>(
      "SELECT id, message, response, created_at FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [session.user.id],
    )

    return NextResponse.json({ history })
  } catch (error) {
    console.error("Chat history error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
