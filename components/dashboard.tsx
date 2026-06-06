"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { PUBLIC_MEMBERS, getMember } from "@/lib/members"
import {
  logout,
  addTransaction,
  deleteTransaction,
  sendMessage,
  markRead,
  clearAllTransactions,
  clearAllMessages,
  type Txn,
  type Msg,
} from "@/app/actions"
import AddModal from "@/components/add-modal"

type Me = {
  name: string
  role: "admin" | "member"
  color: string
  textColor: string
  initials: string
}

type ApiData = {
  me: { name: string; role: string }
  transactions: Txn[]
  messages: Msg[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CAT_ICON: Record<string, string> = {
  food: "ti-salad",
  transport: "ti-car",
  utilities: "ti-bolt",
  health: "ti-heart",
  education: "ti-book",
  entertainment: "ti-music",
  salary: "ti-briefcase",
  other: "ti-dots",
}

export default function Dashboard({ me }: { me: Me }) {
  const router = useRouter()
  const isAdmin = me.role === "admin"
  const isWard = me.name === "Ward"

  const { data, mutate } = useSWR<ApiData>("/api/data", fetcher, {
    refreshInterval: 4000,
    revalidateOnFocus: true,
  })

  const transactions = data?.transactions ?? []
  const messages = data?.messages ?? []

  const [tab, setTab] = useState("transactions")
  const [modalOpen, setModalOpen] = useState(false)

  const tabs = useMemo(() => {
    const t = [
      { id: "transactions", label: "Transactions" },
      { id: "members", label: "Members" },
    ]
    if (isWard) t.push({ id: "messages", label: "Messages" })
    if (isAdmin) t.push({ id: "admin", label: "Admin" })
    return t
  }, [isWard, isAdmin])

  const { income, expense, balance } = useMemo(() => {
    let inc = 0
    let exp = 0
    for (const t of transactions) {
      if (t.type === "income") inc += t.amount
      else exp += t.amount
    }
    return { income: inc, expense: exp, balance: inc - exp }
  }, [transactions])

  async function handleLogout() {
    await logout()
    router.refresh()
  }

  async function handleAdd(input: {
    type: "income" | "expense"
    description: string
    amount: number
    category: string
  }) {
    await addTransaction(input)
    setModalOpen(false)
    mutate()
  }

  async function handleDelete(id: string) {
    await deleteTransaction(id)
    mutate()
  }

  return (
    <div className="screen">
      <header className="dash-header">
        <div>
          <div className="dash-title">
            Barakat
            {isAdmin && (
              <span className="admin-badge">
                <i className="ti ti-shield" style={{ fontSize: 10 }} /> Admin
              </span>
            )}
          </div>
          <div className="dash-user">Welcome back, {me.name}</div>
        </div>
        <button className="icon-btn" aria-label="Sign out" onClick={handleLogout}>
          <i className="ti ti-logout" />
        </button>
      </header>

      <div className="summary-grid">
        <div className="stat-card">
          <div className="stat-label">Income</div>
          <div className="stat-value income">{income.toFixed(2)} JD</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expenses</div>
          <div className="stat-value expense">{expense.toFixed(2)} JD</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Balance</div>
          <div className="stat-value" style={{ color: balance >= 0 ? "var(--brand)" : "var(--accent)" }}>
            {balance.toFixed(2)} JD
          </div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={"tab" + (tab === t.id ? " active" : "")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "transactions" && (
        <div>
          <div className="section-head">
            <div className="section-title">All transactions</div>
            <button className="add-btn" onClick={() => setModalOpen(true)}>
              <i className="ti ti-plus" /> Add
            </button>
          </div>
          <div className="txn-list">
            {transactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                No transactions yet. Tap Add to record one.
              </div>
            ) : (
              [...transactions].reverse().map((t) => {
                const m = getMember(t.addedBy)
                const icon = CAT_ICON[t.category] || "ti-dots"
                const canDel = isAdmin || t.addedBy === me.name
                const otherDelStyle =
                  isAdmin && t.addedBy !== me.name ? { color: "#c0392b", opacity: 0.7 } : undefined
                return (
                  <div key={t.id} className="txn-item">
                    <div className={"txn-icon " + t.type}>
                      <i className={"ti " + icon} />
                    </div>
                    <div className="txn-info">
                      <div className="txn-name">{t.description}</div>
                      <div className="txn-meta">
                        <span
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: m.color,
                            color: m.textColor,
                            fontSize: 9,
                            fontWeight: 500,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {m.initials}
                        </span>
                        {t.addedBy} · {t.category}
                      </div>
                    </div>
                    <div className={"txn-amount " + t.type}>
                      {t.type === "income" ? "+" : "−"}
                      {t.amount.toFixed(2)} JD
                    </div>
                    {canDel && (
                      <button
                        className="txn-del"
                        style={otherDelStyle}
                        aria-label="Delete"
                        onClick={() => handleDelete(t.id)}
                      >
                        <i className="ti ti-trash" />
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {tab === "members" && (
        <div className="members-grid">
          {PUBLIC_MEMBERS.map((m) => {
            const myT = transactions.filter((t) => t.addedBy === m.name)
            const spent = myT.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0)
            return (
              <div key={m.name} className="member-card">
                <div className="avatar-md" style={{ background: m.color, color: m.textColor }}>
                  {m.initials}
                </div>
                <div>
                  <div className="member-name">
                    {m.name}
                    {m.role === "admin" && (
                      <span className="admin-badge">
                        <i className="ti ti-shield" style={{ fontSize: 9 }} /> Admin
                      </span>
                    )}
                  </div>
                  <div className="member-role">{m.role === "admin" ? "Family admin" : "Member"}</div>
                  <div className="member-stats">
                    {myT.length} txn{myT.length !== 1 ? "s" : ""} · {spent.toFixed(0)} JD
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === "messages" && isWard && (
        <WardMessages messages={messages} onChange={() => mutate()} />
      )}

      {tab === "admin" && isAdmin && (
        <AdminPanel
          transactions={transactions}
          onDelete={handleDelete}
          onClearTxns={async () => {
            await clearAllTransactions()
            mutate()
          }}
          onClearMsgs={async () => {
            await clearAllMessages()
            mutate()
          }}
        />
      )}

      {modalOpen && <AddModal onClose={() => setModalOpen(false)} onSave={handleAdd} />}
    </div>
  )
}

function WardMessages({ messages, onChange }: { messages: Msg[]; onChange: () => void }) {
  const [recipient, setRecipient] = useState("Everyone")
  const [text, setText] = useState("")
  const threadRef = useRef<HTMLDivElement>(null)

  const recipients = ["Everyone", ...PUBLIC_MEMBERS.filter((m) => m.name !== "Ward").map((m) => m.name)]

  const visible = messages.filter((msg) =>
    recipient === "Everyone"
      ? msg.to === "Everyone"
      : msg.to === recipient || (msg.from === recipient && msg.to === "Ward"),
  )

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [visible.length, recipient])

  async function selectRecipient(r: string) {
    setRecipient(r)
    await markRead(r)
    onChange()
  }

  async function send() {
    const t = text.trim()
    if (!t) return
    setText("")
    await sendMessage(recipient, t)
    onChange()
  }

  return (
    <div className="msg-wrap">
      <div className="msg-recipient-row">
        {recipients.map((r) => {
          const m = getMember(r)
          const unread = messages.filter((msg) => msg.to === r && !msg.readByWard).length
          return (
            <button
              key={r}
              className={"rcpt-btn" + (r === recipient ? " selected" : "")}
              onClick={() => selectRecipient(r)}
            >
              {r === "Everyone" ? (
                <>
                  <i className="ti ti-users" style={{ fontSize: 13 }} />
                  Everyone
                </>
              ) : (
                <>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: m.color,
                      color: m.textColor,
                      fontSize: 9,
                      fontWeight: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {m.initials}
                  </span>
                  {r}
                  {unread > 0 && <span className="unread-dot" />}
                </>
              )}
            </button>
          )
        })}
      </div>

      <div className="msg-thread" ref={threadRef}>
        {visible.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, margin: "auto" }}>
            No messages yet.
          </div>
        ) : (
          visible.map((msg) => (
            <div key={msg.id} className={"msg-bubble " + (msg.from === "Ward" ? "sent" : "received")}>
              {msg.from !== "Ward" && <div className="msg-sender">{msg.from}</div>}
              {msg.text}
            </div>
          ))
        )}
      </div>

      <div className="msg-input-row">
        <input
          className="msg-input"
          placeholder={recipient === "Everyone" ? "Message everyone…" : "Message " + recipient + "…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send()
          }}
        />
        <button className="msg-send-btn" onClick={send} aria-label="Send">
          <i className="ti ti-send" />
        </button>
      </div>
    </div>
  )
}

function AdminPanel({
  transactions,
  onDelete,
  onClearTxns,
  onClearMsgs,
}: {
  transactions: Txn[]
  onDelete: (id: string) => void
  onClearTxns: () => void
  onClearMsgs: () => void
}) {
  return (
    <div className="admin-section">
      <div className="admin-title">Admin controls</div>
      <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: "1rem" }}>Only Ward can see this tab.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          className="danger-btn"
          onClick={() => {
            if (confirm("Clear ALL transactions?")) onClearTxns()
          }}
        >
          <i className="ti ti-trash" /> Clear all transactions
        </button>
        <button
          className="danger-btn"
          onClick={() => {
            if (confirm("Clear ALL messages?")) onClearMsgs()
          }}
        >
          <i className="ti ti-message-off" /> Clear all messages
        </button>
      </div>

      <div className="admin-title" style={{ marginTop: "1.75rem" }}>
        Full transaction log
      </div>
      <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 2 }}>
        {transactions.length === 0 ? (
          "No transactions yet."
        ) : (
          [...transactions].reverse().map((t) => {
            const m = getMember(t.addedBy)
            return (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: "0.5px solid var(--border)",
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: m.color,
                    color: m.textColor,
                    fontSize: 10,
                    fontWeight: 500,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {m.initials}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.description}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>
                    {t.addedBy} · {t.category}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    color: t.type === "income" ? "var(--brand)" : "var(--accent)",
                  }}
                >
                  {t.type === "income" ? "+" : "-"}
                  {t.amount.toFixed(2)} JD
                </div>
                <button
                  style={{
                    background: "none",
                    border: "0.5px solid #e74c3c",
                    color: "#c0392b",
                    borderRadius: 8,
                    padding: "5px 9px",
                    cursor: "pointer",
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                  aria-label="Delete"
                  onClick={() => onDelete(t.id)}
                >
                  <i className="ti ti-trash" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
