import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const emails = await query<any[]>(
      "SELECT id, subject, sender, received_at FROM emails WHERE user_id = ? ORDER BY received_at DESC LIMIT 50",
      [session.user.id],
    )

    return NextResponse.json({ emails })
  } catch (error) {
    console.error("Error fetching emails:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
