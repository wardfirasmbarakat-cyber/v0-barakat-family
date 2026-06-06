import { getCurrentMember } from "@/lib/session"

export async function GET() {
  try {
    const member = await getCurrentMember()
    if (!member) return Response.json({ member: null })
    return Response.json({
      member: {
        name: member.name,
        role: member.role,
        color: member.color,
        textColor: member.textColor,
        initials: member.initials,
        businessAccess: member.businessAccess,
      },
    })
  } catch {
    return Response.json({ member: null })
  }
}
