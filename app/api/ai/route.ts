import { getCurrentMember } from "@/lib/session"
import { query } from "@/lib/db"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const me = await getCurrentMember()
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { message, history } = await req.json()

  // Fetch current transactions for context
  const txnRows = await query<{
    type: string; description: string; amount: string; category: string; source: string; created_at: string
  }>(`SELECT type, description, amount, category, source, created_at FROM transactions ORDER BY created_at DESC`)

  const txnSummary = txnRows.slice(0, 50).map(r =>
    `${r.type === "income" ? "دخل" : "مصروف"}: ${r.description} - ${Number(r.amount).toFixed(2)} JOD (${r.category}, ${r.source})`
  ).join("\n")

  const totalIncome = txnRows.filter(r => r.type === "income").reduce((s, r) => s + Number(r.amount), 0)
  const totalExpense = txnRows.filter(r => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0)

  const systemPrompt = `أنت محاسب مالي ذكي لعائلة البركات. تتحدث العربية بطلاقة وتساعد العائلة في إدارة ميزانيتهم.

ملخص الوضع المالي الحالي:
- إجمالي الدخل: ${totalIncome.toFixed(2)} دينار أردني
- إجمالي المصروفات: ${totalExpense.toFixed(2)} دينار أردني
- الرصيد: ${(totalIncome - totalExpense).toFixed(2)} دينار أردني

آخر المعاملات:
${txnSummary || "لا توجد معاملات بعد"}

الكيانات التجارية للعائلة: المدرسة، روضة الأطفال، محل الطائفرة الهجين، المنزل.
المستخدم الحالي: ${me.name} (${me.role === "admin" ? "مدير" : "عضو"})

قدم نصائح مالية مفيدة، حلل الإنفاق، وأجب على الأسئلة بالعربية. كن موجزاً وواضحاً.`

  const messages: Anthropic.MessageParam[] = [
    ...(history || []),
    { role: "user", content: message }
  ]

  const stream = await client.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    }
  })

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  })
}
