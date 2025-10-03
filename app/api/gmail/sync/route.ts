import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { fetchEmails } from "@/lib/gmail"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await fetchEmails(session.user.id, 100)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Gmail sync error:", error)

    if (error.code === 403 || error.message?.includes("insufficient authentication scopes")) {
      return NextResponse.json(
        {
          error: "Insufficient permissions. Please reconnect your Gmail account.",
          needsReauth: true,
        },
        { status: 403 },
      )
    }

    return NextResponse.json({ error: "Failed to sync emails" }, { status: 500 })
  }
}
