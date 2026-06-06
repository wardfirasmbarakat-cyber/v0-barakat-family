"use client"

import { useState, useRef, useEffect } from "react"
import type { TxnSource } from "@/app/actions"

type Props = {
  onClose: () => void
  source?: TxnSource
  onSave: (input: {
    type: "income" | "expense"
    description: string
    amount: number
    category: string
    source: TxnSource
  }) => Promise<void>
}

const CATEGORIES = [
  { value: "food", label: "Food" },
  { value: "transport", label: "Transport" },
  { value: "utilities", label: "Utilities" },
  { value: "health", label: "Health" },
  { value: "education", label: "Education" },
  { value: "entertainment", label: "Entertainment" },
  { value: "salary", label: "Salary" },
  { value: "other", label: "Other" },
]

const SOURCE_LABELS: Record<TxnSource, string> = {
  family: "Family",
  school: "School",
  kindergarten: "Kindergarten",
  altafran_shop: "Altafran Shop",
}

export default function AddModal({ onClose, onSave, source = "family" }: Props) {
  const [type, setType] = useState<"income" | "expense">("expense")
  const [desc, setDesc] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("food")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const descRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => descRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [])

  function setTypeAndCat(t: "income" | "expense") {
    setType(t)
    if (t === "income") setCategory("salary")
    else if (category === "salary") setCategory("food")
  }

  async function handleSave() {
    const d = desc.trim()
    const a = Number.parseFloat(amount)
    if (!d) {
      setError("Please enter a description.")
      return
    }
    if (!a || a <= 0) {
      setError("Please enter a valid amount.")
      return
    }
    setError("")
    setBusy(true)
    try {
      await onSave({ type, description: d, amount: a, category, source })
    } catch {
      setError("Something went wrong. Please try again.")
      setBusy(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-card">
        <div className="modal-handle" />
        <div className="modal-title">
          Add transaction
          {source !== "family" && (
            <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text2)", marginLeft: 6 }}>
              · {SOURCE_LABELS[source]}
            </span>
          )}
        </div>

        <div className="type-toggle">
          <button
            className={"type-btn" + (type === "expense" ? " active-expense" : "")}
            onClick={() => setTypeAndCat("expense")}
          >
            Expense
          </button>
          <button
            className={"type-btn" + (type === "income" ? " active-income" : "")}
            onClick={() => setTypeAndCat("income")}
          >
            Income
          </button>
        </div>

        <div className="field">
          <label htmlFor="m-desc">Description</label>
          <input
            id="m-desc"
            ref={descRef}
            placeholder="e.g. Groceries"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="m-amount">Amount (JD)</label>
          <input
            id="m-amount"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="m-cat">Category</label>
          <select id="m-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="modal-save" onClick={handleSave} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
