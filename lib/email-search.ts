import { query } from "./db"

interface Email {
  id: number
  gmail_id: string
  subject: string
  sender: string
  recipient: string
  body: string
  received_at: Date
}

export function extractKeywords(userQuery: string): string[] {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "he",
    "in",
    "is",
    "it",
    "its",
    "of",
    "on",
    "that",
    "the",
    "to",
    "was",
    "will",
    "with",
    "can",
    "i",
    "my",
    "when",
    "where",
    "what",
    "who",
    "how",
    "do",
    "does",
    "did",
  ])

  const words = userQuery
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))

  return [...new Set(words)]
}

export async function searchRelevantEmails(userId: number, userQuery: string, limit = 5): Promise<Email[]> {
  const keywords = extractKeywords(userQuery)

  if (keywords.length === 0) {
    return query<Email[]>("SELECT * FROM emails WHERE user_id = ? ORDER BY received_at DESC LIMIT ?", [userId, limit])
  }

  const searchTerms = keywords.join(" ")

  try {
    const emails = await query<Email[]>(
      `SELECT *, 
        MATCH(subject, sender, body) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance 
       FROM emails 
       WHERE user_id = ? AND MATCH(subject, sender, body) AGAINST(? IN NATURAL LANGUAGE MODE)
       ORDER BY relevance DESC 
       LIMIT ?`,
      [searchTerms, userId, searchTerms, limit],
    )

    if (emails.length > 0) {
      return emails
    }
  } catch (error) {
    console.error("FULLTEXT search error, falling back to LIKE search:", error)
  }

  const likeConditions = keywords.map(() => "(subject LIKE ? OR sender LIKE ? OR body LIKE ?)").join(" OR ")
  const likeParams: string[] = []
  keywords.forEach((keyword) => {
    const pattern = `%${keyword}%`
    likeParams.push(pattern, pattern, pattern)
  })

  const emails = await query<Email[]>(
    `SELECT * FROM emails 
     WHERE user_id = ? AND (${likeConditions})
     ORDER BY received_at DESC 
     LIMIT ?`,
    [userId, ...likeParams, limit],
  )

  return emails
}

export function formatEmailsForAI(emails: Email[]): string {
  if (emails.length === 0) {
    return "No relevant emails found."
  }

  return emails
    .map((email, index) => {
      return `
Email ${index + 1}:
Subject: ${email.subject || "(No Subject)"}
From: ${email.sender}
To: ${email.recipient}
Date: ${new Date(email.received_at).toLocaleString()}
Body: ${email.body.substring(0, 1000)}${email.body.length > 1000 ? "..." : ""}
---`
    })
    .join("\n")
}
