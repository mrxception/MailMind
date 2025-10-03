"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Loader2, Mail, AlertCircle, Bot, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ChatSidebar } from "@/components/chat-sidebar"
import { parseMarkdown } from "@/lib/markdown"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  emailsFound?: number
  emails?: Array<{
    id: number
    subject: string
    sender: string
    received_at: string
  }>
}

export function ChatInterface() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasConnection, setHasConnection] = useState<boolean | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkConnection()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/gmail/status")
      const data = await response.json()
      setHasConnection(data.connected)

      if (!data.connected) {
        toast({
          title: "Gmail Not Connected",
          description: "Please connect your Gmail account to use the chat feature.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking connection:", error)
      setHasConnection(false)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setCurrentSessionId(null)
    toast({
      title: "New Chat Started",
      description: "You can now start a fresh conversation.",
    })
  }

  const handleSelectChat = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`)
      const data = await response.json()

      if (data.messages) {
        const sessionMessages: Message[] = []
        data.messages.forEach((item: any) => {
          sessionMessages.push({
            id: `${item.id}-user`,
            role: "user",
            content: item.message,
          })
          sessionMessages.push({
            id: `${item.id}-assistant`,
            role: "assistant",
            content: item.response,
          })
        })
        setMessages(sessionMessages)
        setCurrentSessionId(sessionId)
      }
    } catch (error) {
      console.error("Error loading chat session:", error)
      toast({
        title: "Error",
        description: "Failed to load chat session",
        variant: "destructive",
      })
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    if (!hasConnection) {
      toast({
        title: "Gmail Not Connected",
        description: "Please connect your Gmail account first.",
        variant: "destructive",
      })
      return
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, sessionId: currentSessionId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response")
      }

      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId)
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response,
        emailsFound: data.emailsFound,
        emails: data.emails,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      })

      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <ChatSidebar onNewChat={handleNewChat} onSelectChat={handleSelectChat} currentSessionId={currentSessionId} />

      <main className="flex-1 flex flex-col gradient-bg">
        <div className="container mx-auto px-4 py-6 flex-1 flex flex-col max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">MailMind AI Assistant</h2>
              <p className="text-sm text-muted-foreground">Ask questions about your Gmail emails</p>
            </div>
          </div>

          <Card className="flex-1 flex flex-col min-h-0">
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              <div className="flex-1 overflow-y-auto p-6 max-h-[70vh]">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Ask me anything about your emails. For example:
                    </p>
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p className="p-2 bg-muted rounded-md">"When can I receive my cashback?"</p>
                      <p className="p-2 bg-muted rounded-md">"Show me emails from John"</p>
                      <p className="p-2 bg-muted rounded-md">"What are my recent orders?"</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 chat-message ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div
                          className={`flex flex-col gap-2 max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`rounded-lg px-4 py-3 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground border border-border"
                            }`}
                          >
                            {message.role === "assistant" ? (
                              <div
                                className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
                              />
                            ) : (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            )}
                          </div>
                          {message.role === "assistant" && message.emailsFound !== undefined && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>
                                {message.emailsFound} {message.emailsFound === 1 ? "email" : "emails"} analyzed
                              </span>
                            </div>
                          )}
                          {message.emails && message.emails.length > 0 && (
                            <div className="w-full space-y-1">
                              {message.emails.map((email) => (
                                <div
                                  key={email.id}
                                  className="text-xs p-2 bg-muted/50 rounded border border-border hover:bg-muted transition-colors"
                                >
                                  <p className="font-medium truncate">{email.subject || "(No Subject)"}</p>
                                  <p className="text-muted-foreground truncate">{email.sender}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-secondary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {loading && (
                      <div className="flex gap-3 chat-message">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div className="bg-muted rounded-lg px-4 py-3 border border-border">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Analyzing your emails...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-border p-4">
                {!hasConnection && hasConnection !== null && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">Gmail not connected</p>
                      <p className="text-xs text-destructive/80 mt-1">
                        Please connect your Gmail account from the dashboard to use the chat feature.
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about your emails..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading || !hasConnection}
                    className="flex-1"
                  />
                  <Button onClick={handleSend} disabled={loading || !input.trim() || !hasConnection} size="icon">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Press Enter to send, Shift + Enter for new line</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
