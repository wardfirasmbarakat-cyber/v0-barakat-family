"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { PublicMember } from "@/lib/members"
import { login, loginByName } from "@/app/actions"

export default function LoginScreen({ members }: { members: PublicMember[] }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const isIOS = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream
    const standalone = (window.navigator as any).standalone === true
    if (isIOS && !standalone) setShowIosHint(true)
  }, [])

  async function handleMemberTap(name: string) {
    setError("")
    setBusy(true)
    const res = await loginByName(name)
    if (res.ok) router.refresh()
    else {
      setError(res.error)
      setBusy(false)
    }
  }

  async function handleSubmit() {
    if (!email || !password) {
      setError("Please enter your email and password.")
      return
    }
    setError("")
    setBusy(true)
    const res = await login(email, password)
    if (res.ok) router.refresh()
    else {
      setError(res.error)
      setBusy(false)
    }
  }

  return (
    <div className="screen">
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-mark">
              <i className="ti ti-wallet" />
            </div>
            <div>
              <div className="logo-text">Barakat</div>
              <div className="logo-sub">Family Budget</div>
            </div>
          </div>

          <div className="hint-text">Tap your name to sign in</div>
          <div className="member-btns">
            {members.map((m) => (
              <button
                key={m.name}
                type="button"
                disabled={busy}
                className={"member-btn" + (m.role === "admin" ? " admin-btn" : "")}
                onClick={() => handleMemberTap(m.name)}
              >
                <div className="avatar-lg" style={{ background: m.color, color: m.textColor }}>
                  {m.initials}
                </div>
                <span className="member-btn-name">{m.name}</span>
                <span className="member-btn-role">{m.role === "admin" ? "admin" : "member"}</span>
              </button>
            ))}
          </div>

          <div className="divider">or sign in with email</div>

          {error && <div className="error-box">{error}</div>}

          <div className="field">
            <label htmlFor="l-email">Email</label>
            <input
              id="l-email"
              type="email"
              autoComplete="email"
              placeholder="name@barakat.jo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="l-pass">Password</label>
            <input
              id="l-pass"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit()
              }}
            />
          </div>
          <button className="primary-btn" disabled={busy} onClick={handleSubmit}>
            {busy ? "Signing in…" : "Sign in"}
          </button>

          {showIosHint && (
            <div className="ios-hint">
              Tip: tap the Share button, then &quot;Add to Home Screen&quot; to install this app on your iPhone.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
