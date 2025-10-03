import { google } from "googleapis"
import { query } from "./db"

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`,
)

export function getAuthUrl(userId: number) {
  const scopes = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/userinfo.email"]

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: userId.toString(),
    prompt: "consent",
  })
}

export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export async function refreshAccessToken(refreshToken: string) {
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}

export async function getGmailClient(userId: number) {
  const connections = await query<any[]>(
    "SELECT access_token, refresh_token, token_expires_at FROM gmail_connections WHERE user_id = ? ORDER BY connected_at DESC LIMIT 1",
    [userId],
  )

  if (connections.length === 0) {
    throw new Error("No Gmail connection found")
  }

  const connection = connections[0]

  if (new Date(connection.token_expires_at) <= new Date()) {
    const newTokens = await refreshAccessToken(connection.refresh_token)

    await query("UPDATE gmail_connections SET access_token = ?, token_expires_at = ? WHERE user_id = ?", [
      newTokens.access_token,
      new Date(Date.now() + (newTokens.expiry_date || 3600) * 1000),
      userId,
    ])

    oauth2Client.setCredentials(newTokens)
  } else {
    oauth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
    })
  }

  return google.gmail({ version: "v1", auth: oauth2Client })
}

export async function fetchEmails(userId: number, maxResults = 100) {
  const gmail = await getGmailClient(userId)

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults,
  })

  const messages = response.data.messages || []

  const emailPromises = messages.map(async (message) => {
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: message.id!,
      format: "full",
    })

    const headers = msg.data.payload?.headers || []
    const subject = headers.find((h) => h.name === "Subject")?.value || ""
    const from = headers.find((h) => h.name === "From")?.value || ""
    const to = headers.find((h) => h.name === "To")?.value || ""
    const date = headers.find((h) => h.name === "Date")?.value || ""

    let body = ""
    if (msg.data.payload?.body?.data) {
      body = Buffer.from(msg.data.payload.body.data, "base64").toString("utf-8")
    } else if (msg.data.payload?.parts) {
      const textPart = msg.data.payload.parts.find((part) => part.mimeType === "text/plain")
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64").toString("utf-8")
      }
    }

    return {
      gmail_id: message.id!,
      subject,
      sender: from,
      recipient: to,
      body: body.substring(0, 5000), 
      received_at: new Date(date),
    }
  })

  const emails = await Promise.all(emailPromises)

  for (const email of emails) {
    try {
      await query(
        "INSERT INTO emails (user_id, gmail_id, subject, sender, recipient, body, received_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE subject = VALUES(subject), sender = VALUES(sender), recipient = VALUES(recipient), body = VALUES(body), received_at = VALUES(received_at)",
        [userId, email.gmail_id, email.subject, email.sender, email.recipient, email.body, email.received_at],
      )
    } catch (error) {
      console.error("Error storing email:", error)
    }
  }

  return emails
}

export async function getUserEmail(accessToken: string) {
  oauth2Client.setCredentials({ access_token: accessToken })
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
  const userInfo = await oauth2.userinfo.get()
  return userInfo.data.email
}
