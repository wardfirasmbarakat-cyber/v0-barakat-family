"use client"

import { useState, useRef, useEffect } from "react"

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function AiAccountant({ memberName }: { memberName: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const threadRef = useRef<HTMLDivElement>(null)
  const recogRef = useRef<any>(null)

  useEffect(() => {
    if (threadRef.current)
      threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [messages])

  function speak(text: string) {
    if (!ttsEnabled) return
    const synth = window.speechSynthesis
    synth.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = "ar-SA"
    const voices = synth.getVoices()
    const arVoice = voices.find((v) => v.lang.startsWith("ar"))
    if (arVoice) utt.voice = arVoice
    utt.rate = 0.95
    synth.speak(utt)
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    setInput("")
    setBusy(true)

    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    const newMessages: Message[] = [...messages, { role: "user", content: trimmed }]
    setMessages(newMessages)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      })

      if (!res.ok || !res.body) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "عذراً، حدث خطأ. يرجى المحاولة مجدداً." },
        ])
        setBusy(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ""
      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: full }
          return updated
        })
      }

      speak(full)
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "عذراً، تعذّر الاتصال بالخادم." },
      ])
    }
    setBusy(false)
  }

  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("المتصفح لا يدعم التعرف على الصوت. استخدم Chrome.")
      return
    }
    const rec = new SpeechRecognition()
    rec.lang = "ar-SA"
    rec.interimResults = false
    rec.maxAlternatives = 1
    recogRef.current = rec

    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      sendMessage(transcript)
    }
    rec.start()
  }

  function stopListening() {
    recogRef.current?.stop()
    setListening(false)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 0 8px",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text1)" }}>
            <i className="ti ti-robot" style={{ marginRight: 6, color: "var(--brand)" }} />
            المحاسب الذكي
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
            اسألني عن ميزانية العائلة بالعربية
          </div>
        </div>
        <button
          style={{
            background: ttsEnabled ? "var(--brand)" : "var(--surface2)",
            border: "none",
            borderRadius: 10,
            padding: "6px 12px",
            color: ttsEnabled ? "#fff" : "var(--text2)",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
          onClick={() => {
            if (ttsEnabled) window.speechSynthesis?.cancel()
            setTtsEnabled((v) => !v)
          }}
        >
          <i className={"ti " + (ttsEnabled ? "ti-volume" : "ti-volume-off")} />
          {ttsEnabled ? "صوت" : "صامت"}
        </button>
      </div>

      {/* Chat thread */}
      <div
        ref={threadRef}
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "8px 0",
          minHeight: 200,
          maxHeight: 420,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "var(--text3)",
              fontSize: 13,
              marginTop: 40,
              lineHeight: 1.8,
              direction: "rtl",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>🤖</div>
            مرحباً {memberName}! أنا محاسبك الذكي.
            <br />
            اسألني عن ميزانيتك أو اضغط المايك للكلام.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "82%",
                padding: "10px 14px",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: m.role === "user" ? "var(--brand)" : "var(--surface2)",
                color: m.role === "user" ? "#fff" : "var(--text1)",
                fontSize: 14,
                lineHeight: 1.6,
                direction: "rtl",
                textAlign: "right",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content || (m.role === "assistant" && busy ? "…" : "")}
            </div>
          </div>
        ))}
      </div>

      {/* Input row */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          paddingTop: 8,
          borderTop: "0.5px solid var(--border)",
        }}
      >
        <button
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: 12,
            border: "none",
            background: listening ? "#e74c3c" : "var(--surface2)",
            color: listening ? "#fff" : "var(--text2)",
            fontSize: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          onClick={listening ? stopListening : startListening}
          aria-label={listening ? "توقف عن الاستماع" : "تحدث"}
        >
          <i className={"ti " + (listening ? "ti-microphone-off" : "ti-microphone")} />
        </button>

        <input
          style={{
            flex: 1,
            height: 44,
            borderRadius: 12,
            border: "0.5px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--text1)",
            padding: "0 14px",
            fontSize: 14,
            direction: "rtl",
            outline: "none",
          }}
          placeholder="اكتب سؤالك هنا…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              sendMessage(input)
            }
          }}
          disabled={busy}
        />

        <button
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: 12,
            border: "none",
            background: busy || !input.trim() ? "var(--surface2)" : "var(--brand)",
            color: busy || !input.trim() ? "var(--text3)" : "#fff",
            fontSize: 18,
            cursor: busy || !input.trim() ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          onClick={() => sendMessage(input)}
          disabled={busy || !input.trim()}
          aria-label="إرسال"
        >
          <i className="ti ti-send" />
        </button>
      </div>
    </div>
  )
}
