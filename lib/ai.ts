interface Message {
  role: "user" | "assistant"
  content: string
}

export async function chatWithDeepSeek(messages: Message[]): Promise<string> {
  const apiUrl = process.env.AI_API_URL || ":3"
  const apiKey = process.env.AI_KEY

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        model: process.env.AI_MODEL,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    throw new Error("Failed to get AI response")
  }
}
