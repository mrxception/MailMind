import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getAuthUrl } from "@/lib/gmail"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authUrl = getAuthUrl(session.user.id)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("Gmail auth error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
