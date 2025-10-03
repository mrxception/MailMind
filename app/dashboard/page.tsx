import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { Header } from "@/components/header"
import { DashboardContent } from "@/components/dashboard-content"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <DashboardContent user={session.user} />
    </div>
  )
}
