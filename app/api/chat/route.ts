import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { searchRelevantEmails, formatEmailsForAI } from "@/lib/email-search"
import { chatWithDeepSeek } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, sessionId } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const connections = await query<any[]>("SELECT id FROM gmail_connections WHERE user_id = ? LIMIT 1", [
      session.user.id,
    ])

    if (connections.length === 0) {
      return NextResponse.json({ error: "Please connect your Gmail account first" }, { status: 400 })
    }

    const relevantEmails = await searchRelevantEmails(session.user.id, message, 5)

    const emailContext = formatEmailsForAI(relevantEmails)

    const systemPrompt = `You are a helpful AI assistant that analyzes Gmail emails. The user has asked a question about their emails. 

Here are the most relevant emails found based on their query:

${emailContext}

Please answer the user's question based on the email content provided above. If the emails don't contain relevant information, let the user know politely. Be concise and helpful.`

    const aiResponse = await chatWithDeepSeek([
      { role: "user", content: systemPrompt },
      { role: "user", content: message },
    ])

    let currentSessionId = sessionId

    if (!currentSessionId) {
      const title = message.substring(0, 50) + (message.length > 50 ? "..." : "")
      const result = await query<any>("INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)", [
        session.user.id,
        title,
      ])
      currentSessionId = result.insertId
    } else {
      await query("UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", [currentSessionId])
    }

    await query("INSERT INTO chat_history (user_id, session_id, message, response, email_ids) VALUES (?, ?, ?, ?, ?)", [
      session.user.id,
      currentSessionId,
      message,
      aiResponse,
      JSON.stringify(relevantEmails.map((e) => e.id)),
    ])

    return NextResponse.json({
      response: aiResponse,
      sessionId: currentSessionId,
      emailsFound: relevantEmails.length,
      emails: relevantEmails.map((e) => ({
        id: e.id,
        subject: e.subject,
        sender: e.sender,
        received_at: e.received_at,
      })),
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
