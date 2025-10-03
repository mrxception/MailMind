import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await query("DELETE FROM chat_history WHERE user_id = ?", [session.user.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Clear chat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
