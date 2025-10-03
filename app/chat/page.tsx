import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { Header } from "@/components/header"
import { ChatInterface } from "@/components/chat-interface"

export default async function ChatPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showBackButton backTo="/dashboard" />
      <ChatInterface />
    </div>
  )
}
