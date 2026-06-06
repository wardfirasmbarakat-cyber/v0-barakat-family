export type Role = "admin" | "member"

export type Member = {
  name: string
  email: string
  password: string
  role: Role
  color: string
  textColor: string
  initials: string
}

// Fixed family roster (matches the original app).
export const MEMBERS: Member[] = [
  { name: "Ward", email: "ward@barakat.jo", password: "20088002", role: "admin", color: "#E1F5EE", textColor: "#085041", initials: "WB" },
  { name: "Safa", email: "safa@barakat.jo", password: "123321", role: "member", color: "#FBEAF0", textColor: "#993556", initials: "SA" },
  { name: "Firas", email: "firas@barakat.jo", password: "123321", role: "member", color: "#FAECE7", textColor: "#993C1D", initials: "FB" },
  { name: "Joud", email: "joud@barakat.jo", password: "123321", role: "member", color: "#EEEDFE", textColor: "#534AB7", initials: "JB" },
  { name: "Jannah", email: "jannah@barakat.jo", password: "123321", role: "member", color: "#FAEEDA", textColor: "#854F0B", initials: "JN" },
  { name: "Mennah", email: "mennah@barakat.jo", password: "123321", role: "member", color: "#E6F1FB", textColor: "#185FA5", initials: "MB" },
  { name: "Adam", email: "adam@barakat.jo", password: "123321", role: "member", color: "#E1F5EE", textColor: "#0F6E56", initials: "AB" },
]

// Public-safe member info (no passwords) for the client.
export type PublicMember = Omit<Member, "password">

export const PUBLIC_MEMBERS: PublicMember[] = MEMBERS.map(({ password, ...rest }) => rest)

export function getMember(name: string): PublicMember {
  return (
    PUBLIC_MEMBERS.find((m) => m.name === name) ?? {
      name: name || "?",
      email: "",
      role: "member",
      color: "#eee",
      textColor: "#555",
      initials: (name || "?")[0],
    }
  )
}
