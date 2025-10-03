"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Mail, LinkIcon, Loader2 } from "lucide-react"
import type { User } from "@/lib/auth"

interface DashboardContentProps {
  user: User
}

interface GmailStatus {
  connected: boolean
  email?: string
  connectedAt?: string
  emailCount?: number
}

export function DashboardContent({ user }: DashboardContentProps) {
  const router = useRouter()
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGmailStatus()
  }, [])

  const fetchGmailStatus = async () => {
    try {
      const response = await fetch("/api/gmail/status")
      const data = await response.json()
      setGmailStatus(data)
    } catch (error) {
      console.error("Error fetching Gmail status:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 gradient-bg">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-balance">Welcome back, {user.name || user.email}</h2>
            <p className="text-muted-foreground mt-2">
              Your AI-powered assistant for analyzing and understanding your Gmail emails
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Chat with AI</CardTitle>
                    <CardDescription>Ask questions about your emails</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Use natural language to search and analyze your email conversations
                </p>
                <Button
                  className="w-full"
                  onClick={() => router.push("/chat")}
                  disabled={!gmailStatus?.connected || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : gmailStatus?.connected ? (
                    "Start Chatting"
                  ) : (
                    "Connect Gmail First"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-chart-2/20 flex items-center justify-center">
                    <LinkIcon className="h-6 w-6 text-chart-2" />
                  </div>
                  <div>
                    <CardTitle>Gmail Connection</CardTitle>
                    <CardDescription>Manage your email access</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : gmailStatus?.connected ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Connected Account</p>
                      <p className="text-sm text-muted-foreground">{gmailStatus.email}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Emails synced</span>
                      <span className="font-medium">{gmailStatus.emailCount || 0}</span>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/connect")}>
                      View Details
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Connect your Gmail account to start using the AI assistant
                    </p>
                    <Button className="w-full" onClick={() => router.push("/connect")}>
                      <Mail className="mr-2 h-4 w-4" />
                      Connect Gmail
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {gmailStatus?.connected && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Overview of your email data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{gmailStatus.emailCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Emails</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">Ready</p>
                    <p className="text-sm text-muted-foreground">AI Status</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">Active</p>
                    <p className="text-sm text-muted-foreground">Connection</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
