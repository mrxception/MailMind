import { type NextRequest, NextResponse } from "next/server"
import { getTokensFromCode, getUserEmail, fetchEmails } from "@/lib/gmail"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code || !state) {
      return NextResponse.redirect(new URL("/dashboard?error=missing_params", request.url))
    }

    const userId = Number.parseInt(state)

    const tokens = await getTokensFromCode(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(new URL("/dashboard?error=token_error", request.url))
    }

    const gmailEmail = await getUserEmail(tokens.access_token)

    const expiresAt = new Date(Date.now() + (tokens.expiry_date || 3600000))

    await query(
      "INSERT INTO gmail_connections (user_id, gmail_email, access_token, refresh_token, token_expires_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), refresh_token = VALUES(refresh_token), token_expires_at = VALUES(token_expires_at)",
      [userId, gmailEmail, tokens.access_token, tokens.refresh_token, expiresAt],
    )

    fetchEmails(userId, 100).catch((error) => {
      console.error("Error fetching emails:", error)
    })

    return NextResponse.redirect(new URL("/connect?success=true", request.url))
  } catch (error) {
    console.error("Gmail callback error:", error)
    return NextResponse.redirect(new URL("/dashboard?error=callback_failed", request.url))
  }
}
