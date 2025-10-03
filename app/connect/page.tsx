import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { Header } from "@/components/header"
import { ConnectContent } from "@/components/connect-content"

export default async function ConnectPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showBackButton backTo="/dashboard" />
      <ConnectContent />
    </div>
  )
}
