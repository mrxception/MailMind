"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/react-scroll-area"
import { Mail, Loader2, CheckCircle2, RefreshCw, AlertCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Email {
  id: number
  subject: string
  sender: string
  received_at: string
}

export function ConnectContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [gmailEmail, setGmailEmail] = useState("")
  const [emails, setEmails] = useState<Email[]>([])
  const [emailCount, setEmailCount] = useState(0)
  const [needsReauth, setNeedsReauth] = useState(false)

  useEffect(() => {
    checkConnection()

    // Show success message if redirected from OAuth
    if (searchParams.get("success") === "true") {
      toast({
        title: "Gmail Connected",
        description: "Your Gmail account has been successfully connected and emails are being synced.",
      })
    }
  }, [searchParams])

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/gmail/status")
      const data = await response.json()

      if (data.connected) {
        setConnected(true)
        setGmailEmail(data.email)
        setEmailCount(data.emailCount)
        setNeedsReauth(false)
        await fetchEmails()
      }
    } catch (error) {
      console.error("Error checking connection:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmails = async () => {
    try {
      const response = await fetch("/api/emails/list")
      const data = await response.json()
      setEmails(data.emails || [])
    } catch (error) {
      console.error("Error fetching emails:", error)
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const response = await fetch("/api/gmail/auth")
      const data = await response.json()

      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error("Error connecting Gmail:", error)
      toast({
        title: "Connection Failed",
        description: "Failed to initiate Gmail connection. Please try again.",
        variant: "destructive",
      })
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      const response = await fetch("/api/gmail/disconnect", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Disconnected",
          description: "Your Gmail account has been disconnected.",
        })
        setConnected(false)
        setGmailEmail("")
        setEmailCount(0)
        setEmails([])
        setNeedsReauth(false)
      }
    } catch (error) {
      console.error("Error disconnecting Gmail:", error)
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect Gmail. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDisconnecting(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/gmail/sync", { method: "POST" })
      const data = await response.json()

      if (data.needsReauth) {
        setNeedsReauth(true)
        toast({
          title: "Reconnection Required",
          description: "Please reconnect your Gmail account to grant necessary permissions.",
          variant: "destructive",
        })
        return
      }

      if (data.success) {
        toast({
          title: "Sync Complete",
          description: "Your emails have been synced successfully.",
        })
        await checkConnection()
        await fetchEmails()
      }
    } catch (error) {
      console.error("Error syncing emails:", error)
      toast({
        title: "Sync Failed",
        description: "Failed to sync emails. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  return (
    <main className="flex-1 gradient-bg">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-balance">Gmail Connection</h2>
            <p className="text-muted-foreground mt-2">Connect your Gmail account to enable AI-powered email analysis</p>
          </div>

          {!connected ? (
            <Card>
              <CardHeader>
                <CardTitle>Connect Your Gmail Account</CardTitle>
                <CardDescription>Authorize access to your Gmail to start analyzing your emails with AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">What we'll access:</p>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                        <li>Read your email messages</li>
                        <li>View your email address</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <Button onClick={handleConnect} disabled={connecting} className="w-full" size="lg">
                  {connecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-5 w-5" />
                      Connect with Google
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {needsReauth && (
                <Card className="border-destructive">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <CardTitle className="text-destructive">Reconnection Required</CardTitle>
                        <CardDescription className="mt-2">
                          Your Gmail connection needs to be refreshed to grant the necessary permissions for syncing
                          emails.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button onClick={handleConnect} disabled={connecting}>
                        {connecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Reconnecting...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reconnect Gmail
                          </>
                        )}
                      </Button>
                      <Button onClick={handleDisconnect} disabled={disconnecting} variant="outline">
                        {disconnecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          "Disconnect"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Connected
                      </CardTitle>
                      <CardDescription>Your Gmail account is connected and synced</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSync} disabled={syncing || needsReauth} variant="outline">
                        {syncing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Sync Now
                          </>
                        )}
                      </Button>
                      <Button onClick={handleDisconnect} disabled={disconnecting} variant="outline">
                        {disconnecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          "Disconnect"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Connected Account</p>
                      <p className="font-medium mt-1">{gmailEmail}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Emails Synced</p>
                      <p className="font-medium mt-1">{emailCount} emails</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Emails</CardTitle>
                  <CardDescription>Preview of your synced emails</CardDescription>
                </CardHeader>
                <CardContent>
                  {emails.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No emails synced yet</p>
                      <Button
                        onClick={handleSync}
                        variant="outline"
                        className="mt-4 bg-transparent"
                        disabled={needsReauth}
                      >
                        Sync Emails
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {emails.map((email) => (
                          <div
                            key={email.id}
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{email.subject || "(No Subject)"}</p>
                                <p className="text-sm text-muted-foreground truncate mt-1">{email.sender}</p>
                              </div>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(email.received_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
