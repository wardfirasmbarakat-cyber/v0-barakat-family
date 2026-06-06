import { getCurrentMember } from "@/lib/session"
import { PUBLIC_MEMBERS } from "@/lib/members"
import LoginScreen from "@/components/login-screen"
import Dashboard from "@/components/dashboard"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Page() {
  try {
    const me = await getCurrentMember()

    return (
      <div className="app">
        {me ? (
          <Dashboard
            me={{ name: me.name, role: me.role, color: me.color, textColor: me.textColor, initials: me.initials }}
          />
        ) : (
          <LoginScreen members={PUBLIC_MEMBERS} />
        )}
      </div>
    )
  } catch (error) {
    console.error("Page error:", error)
    return (
      <div className="app">
        <LoginScreen members={PUBLIC_MEMBERS} />
      </div>
    )
  }
}
