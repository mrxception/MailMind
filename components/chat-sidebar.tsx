"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/react-scroll-area"
import { Plus, MessageSquare, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ChatSession {
  id: number
  title: string
  messageCount: number
  updated_at: string
}

interface ChatSidebarProps {
  onNewChat: () => void
  onSelectChat: (sessionId: number) => void
  currentSessionId: number | null
}

export function ChatSidebar({ onNewChat, onSelectChat, currentSessionId }: ChatSidebarProps) {
  const { toast } = useToast()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (currentSessionId) {
      loadSessions()
    }
  }, [currentSessionId])

  const loadSessions = async () => {
    try {
      const response = await fetch("/api/chat/sessions")
      const data = await response.json()

      if (data.sessions) {
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error("Error loading sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSessions(sessions.filter((s) => s.id !== sessionId))
        if (currentSessionId === sessionId) {
          onNewChat()
        }
        toast({
          title: "Chat Deleted",
          description: "Chat session has been removed.",
        })
      }
    } catch (error) {
      console.error("Error deleting session:", error)
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Button onClick={onNewChat} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No chat history yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                  currentSessionId === session.id ? "bg-muted" : ""
                }`}
                onClick={() => onSelectChat(session.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {session.messageCount} {session.messageCount === 1 ? "message" : "messages"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
