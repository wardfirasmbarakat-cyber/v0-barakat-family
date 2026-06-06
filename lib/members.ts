export type Role = "admin" | "member"
export type BusinessSource = "school" | "kindergarten" | "altafran_shop"

export type Member = {
  name: string
  email: string
  password: string
  role: Role
  color: string
  textColor: string
  initials: string
  businessAccess: BusinessSource[]
}

export const MEMBERS: Member[] = [
  { name: "Ward",   email: "ward@barakat.jo",   password: "20088002", role: "admin",  color: "#E1F5EE", textColor: "#085041", initials: "WB", businessAccess: ["school", "kindergarten", "altafran_shop"] },
  { name: "Safa",   email: "safa@barakat.jo",   password: "123321",   role: "member", color: "#FBEAF0", textColor: "#993556", initials: "SA", businessAccess: ["school", "kindergarten"] },
  { name: "Firas",  email: "firas@barakat.jo",  password: "123321",   role: "member", color: "#FAECE7", textColor: "#993C1D", initials: "FB", businessAccess: ["altafran_shop"] },
  { name: "Joud",   email: "joud@barakat.jo",   password: "123321",   role: "member", color: "#EEEDFE", textColor: "#534AB7", initials: "JB", businessAccess: [] },
  { name: "Jannah", email: "jannah@barakat.jo", password: "123321",   role: "member", color: "#FAEEDA", textColor: "#854F0B", initials: "JN", businessAccess: [] },
  { name: "Mennah", email: "mennah@barakat.jo", password: "123321",   role: "member", color: "#E6F1FB", textColor: "#185FA5", initials: "MB", businessAccess: [] },
  { name: "Adam",   email: "adam@barakat.jo",   password: "123321",   role: "member", color: "#E1F5EE", textColor: "#0F6E56", initials: "AB", businessAccess: ["altafran_shop"] },
]

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
      businessAccess: [],
    }
  )
}

export const BUSINESS_LABELS: Record<BusinessSource, string> = {
  school: "School",
  kindergarten: "Kindergarten",
  altafran_shop: "Altafran Shop",
}

export const BUSINESS_ICONS: Record<BusinessSource, string> = {
  school: "ti-school",
  kindergarten: "ti-baby-carriage",
  altafran_shop: "ti-shopping-cart",
}

export const BUSINESS_COLORS: Record<BusinessSource, { bg: string; text: string }> = {
  school:        { bg: "#EBF4FF", text: "#1D5FA5" },
  kindergarten:  { bg: "#FFF0F6", text: "#A33070" },
  altafran_shop: { bg: "#F0FFF4", text: "#1A6B44" },
}
