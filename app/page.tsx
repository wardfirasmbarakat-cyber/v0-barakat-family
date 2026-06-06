import { getCurrentMember } from "@/lib/session"
import { PUBLIC_MEMBERS } from "@/lib/members"
import LoginScreen from "@/components/login-screen"
import Dashboard from "@/components/dashboard"

export const dynamic = "force-dynamic"

export default async function Page() {
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
}
