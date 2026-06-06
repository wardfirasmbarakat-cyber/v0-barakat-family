"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import {
  PUBLIC_MEMBERS,
  getMember,
  BUSINESS_LABELS,
  BUSINESS_ICONS,
  BUSINESS_COLORS,
  type BusinessSource,
} from "@/lib/members"
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
  type TxnSource,
} from "@/app/actions"
import AddModal from "@/components/add-modal"

type Me = {
  name: string
  role: "admin" | "member"
  color: string
  textColor: string
  initials: string
  businessAccess?: BusinessSource[]
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
  const businessAccess: BusinessSource[] = me.businessAccess ?? []

  const { data, mutate } = useSWR<ApiData>("/api/data", fetcher, {
    refreshInterval: 4000,
    revalidateOnFocus: true,
  })

  const transactions = data?.transactions ?? []
  const messages = data?.messages ?? []

  const [tab, setTab] = useState("transactions")
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSource, setModalSource] = useState<TxnSource>("family")

  const tabs = useMemo(() => {
    const t = [
      { id: "transactions", label: "Transactions", icon: "ti-list" },
      { id: "members", label: "Members", icon: "ti-users" },
    ]
    for (const src of businessAccess) {
      t.push({ id: src, label: BUSINESS_LABELS[src], icon: BUSINESS_ICONS[src] })
    }
    if (isWard) {
      t.push({ id: "overview", label: "Overview", icon: "ti-layout-dashboard" })
      t.push({ id: "messages", label: "Messages", icon: "ti-message" })
    }
    if (isAdmin) t.push({ id: "admin", label: "Admin", icon: "ti-shield" })
    return t
  }, [isWard, isAdmin, businessAccess])

  const familyTxns = useMemo(
    () => transactions.filter((t) => !t.source || t.source === "family"),
    [transactions],
  )

  const { income, expense, balance } = useMemo(() => {
    let inc = 0,
      exp = 0
    for (const t of familyTxns) {
      if (t.type === "income") inc += t.amount
      else exp += t.amount
    }
    return { income: inc, expense: exp, balance: inc - exp }
  }, [familyTxns])

  async function handleLogout() {
    await logout()
    router.refresh()
  }

  function openModal(source: TxnSource = "family") {
    setModalSource(source)
    setModalOpen(true)
  }

  async function handleAdd(input: {
    type: "income" | "expense"
    description: string
    amount: number
    category: string
    source: TxnSource
  }) {
    await addTransaction(input)
    setModalOpen(false)
    mutate()
  }

  async function handleDelete(id: string) {
    await deleteTransaction(id)
    mutate()
  }

  const activeSource = (["school", "kindergarten", "altafran_shop", "home"] as BusinessSource[]).includes(
    tab as BusinessSource,
  )
    ? (tab as BusinessSource)
    : null

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

      {(tab === "transactions" || tab === "members") && (
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
            <div
              className="stat-value"
              style={{ color: balance >= 0 ? "var(--brand)" : "var(--accent)" }}
            >
              {balance.toFixed(2)} JD
            </div>
          </div>
        </div>
      )}

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={"tab" + (tab === t.id ? " active" : "")}
            onClick={() => setTab(t.id)}
          >
            <i className={"ti " + t.icon} style={{ fontSize: 13, marginRight: 4 }} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "transactions" && (
        <TxnList
          transactions={familyTxns}
          me={{ ...me, businessAccess }}
          canAdd
          onAdd={() => openModal("family")}
          onDelete={handleDelete}
          title="Family transactions"
        />
      )}

      {tab === "members" && (
        <div className="members-grid">
          {PUBLIC_MEMBERS.map((m) => {
            const myT = transactions.filter((t) => t.addedBy === m.name)
            const spent = myT
              .filter((t) => t.type === "expense")
              .reduce((a, b) => a + b.amount, 0)
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
                  <div className="member-role">
                    {m.role === "admin" ? "Family admin" : "Member"}
                    {m.businessAccess.length > 0 && (
                      <span style={{ color: "var(--text3)", marginLeft: 4 }}>
                        · {m.businessAccess.map((b) => BUSINESS_LABELS[b]).join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="member-stats">
                    {myT.length} txn{myT.length !== 1 ? "s" : ""} · {spent.toFixed(0)} JD
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeSource && (
        <BusinessPage
          source={activeSource}
          transactions={transactions.filter((t) => t.source === activeSource)}
          me={{ ...me, businessAccess }}
          onAdd={() => openModal(activeSource)}
          onDelete={handleDelete}
        />
      )}

      {tab === "overview" && isWard && (
        <OverviewPage transactions={transactions} onDelete={handleDelete} />
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

      {modalOpen && (
        <AddModal source={modalSource} onClose={() => setModalOpen(false)} onSave={handleAdd} />
      )}
    </div>
  )
}

// ─── Reusable transaction list ────────────────────────────────────────────────

function TxnList({
  transactions,
  me,
  onAdd,
  onDelete,
  title,
  canAdd = true,
}: {
  transactions: Txn[]
  me: Me & { businessAccess: BusinessSource[] }
  onAdd: () => void
  onDelete: (id: string) => void
  title: string
  canAdd?: boolean
}) {
  const isAdmin = me.role === "admin"

  function canDelete(t: Txn) {
    if (isAdmin) return true
    if (t.addedBy === me.name) return true
    // business managers can delete within their entities
    if (t.source && t.source !== "family" && me.businessAccess.includes(t.source as BusinessSource))
      return true
    return false
  }

  return (
    <div>
      <div className="section-head">
        <div className="section-title">{title}</div>
        {canAdd && (
          <button className="add-btn" onClick={onAdd}>
            <i className="ti ti-plus" /> Add
          </button>
        )}
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
            const del = canDelete(t)
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
                {del && (
                  <button
                    className="txn-del"
                    style={otherDelStyle}
                    aria-label="Delete"
                    onClick={() => onDelete(t.id)}
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
  )
}

// ─── Business entity page ─────────────────────────────────────────────────────

function BusinessPage({
  source,
  transactions,
  me,
  onAdd,
  onDelete,
}: {
  source: BusinessSource
  transactions: Txn[]
  me: Me & { businessAccess: BusinessSource[] }
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  const colors = BUSINESS_COLORS[source]
  const isAdmin = me.role === "admin"
  const canAdd = isAdmin || me.businessAccess.includes(source)

  const income = transactions.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0)
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((a, b) => a + b.amount, 0)
  const balance = income - expense

  return (
    <div>
      <div
        style={{
          background: colors.bg,
          borderRadius: 14,
          padding: "16px 18px",
          margin: "12px 0",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: colors.text + "22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.text,
            fontSize: 22,
          }}
        >
          <i className={"ti " + BUSINESS_ICONS[source]} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: colors.text }}>
            {BUSINESS_LABELS[source]}
          </div>
          <div style={{ fontSize: 12, color: colors.text + "cc", marginTop: 2 }}>
            Income: {income.toFixed(2)} JD · Expenses: {expense.toFixed(2)} JD
          </div>
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: balance >= 0 ? "#1a6b44" : "#c0392b",
          }}
        >
          {balance >= 0 ? "+" : ""}
          {balance.toFixed(2)} JD
        </div>
      </div>

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
          <div
            className="stat-value"
            style={{ color: balance >= 0 ? "var(--brand)" : "var(--accent)" }}
          >
            {balance.toFixed(2)} JD
          </div>
        </div>
      </div>

      <TxnList
        transactions={transactions}
        me={me}
        onAdd={onAdd}
        onDelete={onDelete}
        title={BUSINESS_LABELS[source] + " transactions"}
        canAdd={canAdd}
      />
    </div>
  )
}

// ─── Overview page (Ward only) ────────────────────────────────────────────────

const ALL_SOURCES: Array<{
  id: TxnSource
  label: string
  icon: string
  colors: { bg: string; text: string }
}> = [
  { id: "family", label: "Family", icon: "ti-home", colors: { bg: "#F0F4FF", text: "#3B5998" } },
  {
    id: "school",
    label: "School",
    icon: BUSINESS_ICONS.school,
    colors: BUSINESS_COLORS.school,
  },
  {
    id: "kindergarten",
    label: "Kindergarten",
    icon: BUSINESS_ICONS.kindergarten,
    colors: BUSINESS_COLORS.kindergarten,
  },
  {
    id: "altafran_shop",
    label: "Altafran Shop",
    icon: BUSINESS_ICONS.altafran_shop,
    colors: BUSINESS_COLORS.altafran_shop,
  },
  {
    id: "home",
    label: "Home",
    icon: BUSINESS_ICONS.home,
    colors: BUSINESS_COLORS.home,
  },
]

function OverviewPage({
  transactions,
  onDelete,
}: {
  transactions: Txn[]
  onDelete: (id: string) => void
}) {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((a, b) => a + b.amount, 0)
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((a, b) => a + b.amount, 0)
  const totalBalance = totalIncome - totalExpense

  return (
    <div>
      <div
        style={{ padding: "14px 0 4px", fontWeight: 700, fontSize: 15, color: "var(--text1)" }}
      >
        <i className="ti ti-chart-bar" style={{ marginRight: 6 }} />
        All Entities Overview
      </div>

      <div className="summary-grid">
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value income">{totalIncome.toFixed(2)} JD</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value expense">{totalExpense.toFixed(2)} JD</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Balance</div>
          <div
            className="stat-value"
            style={{ color: totalBalance >= 0 ? "var(--brand)" : "var(--accent)" }}
          >
            {totalBalance.toFixed(2)} JD
          </div>
        </div>
      </div>

      {ALL_SOURCES.map(({ id, label, icon, colors }) => {
        const src = transactions.filter((t) => (t.source ?? "family") === id)
        const inc = src.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0)
        const exp = src.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0)
        const bal = inc - exp
        return (
          <div
            key={id}
            style={{
              background: colors.bg,
              borderRadius: 14,
              padding: "14px 16px",
              marginBottom: 10,
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: colors.text + "22",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.text,
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              <i className={"ti " + icon} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>{label}</div>
              <div style={{ fontSize: 12, color: colors.text + "bb", marginTop: 2 }}>
                ↑ {inc.toFixed(2)} JD &nbsp;↓ {exp.toFixed(2)} JD
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: bal >= 0 ? "#1a6b44" : "#c0392b",
                }}
              >
                {bal >= 0 ? "+" : ""}
                {bal.toFixed(2)} JD
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>{src.length} txns</div>
            </div>
          </div>
        )
      })}

      <div
        style={{ fontWeight: 700, fontSize: 14, color: "var(--text1)", margin: "18px 0 8px" }}
      >
        <i className="ti ti-list" style={{ marginRight: 6 }} />
        Full Transaction Log
      </div>
      <div className="txn-list">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            No transactions yet.
          </div>
        ) : (
          [...transactions].reverse().map((t) => {
            const m = getMember(t.addedBy)
            const icon = CAT_ICON[t.category] || "ti-dots"
            const srcInfo = ALL_SOURCES.find((s) => s.id === (t.source ?? "family"))
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
                    {t.addedBy} · {srcInfo?.label ?? t.source ?? "family"}
                  </div>
                </div>
                <div className={"txn-amount " + t.type}>
                  {t.type === "income" ? "+" : "−"}
                  {t.amount.toFixed(2)} JD
                </div>
                <button
                  className="txn-del"
                  style={{ color: "#c0392b", opacity: 0.7 }}
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

// ─── Ward messages ────────────────────────────────────────────────────────────

function WardMessages({ messages, onChange }: { messages: Msg[]; onChange: () => void }) {
  const [recipient, setRecipient] = useState("Everyone")
  const [text, setText] = useState("")
  const threadRef = useRef<HTMLDivElement>(null)

  const recipients = [
    "Everyone",
    ...PUBLIC_MEMBERS.filter((m) => m.name !== "Ward").map((m) => m.name),
  ]

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
          <div
            style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, margin: "auto" }}
          >
            No messages yet.
          </div>
        ) : (
          visible.map((msg) => (
            <div
              key={msg.id}
              className={"msg-bubble " + (msg.from === "Ward" ? "sent" : "received")}
            >
              {msg.from !== "Ward" && <div className="msg-sender">{msg.from}</div>}
              {msg.text}
            </div>
          ))
        )}
      </div>

      <div className="msg-input-row">
        <input
          className="msg-input"
          placeholder={
            recipient === "Everyone" ? "Message everyone…" : "Message " + recipient + "…"
          }
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

// ─── Admin panel ──────────────────────────────────────────────────────────────

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
      <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: "1rem" }}>
        Only Ward can see this tab.
      </p>
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
            const srcInfo = ALL_SOURCES.find((s) => s.id === (t.source ?? "family"))
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
                    {t.addedBy} · {t.category} · {srcInfo?.label ?? t.source ?? "family"}
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
