import { NextResponse } from 'next/server'
import { verifyUser } from '@/lib/verifyUser'

export async function POST(request) {
  const { user, error: authError } = await verifyUser(request)
  if (!user) {
    return NextResponse.json({ error: authError }, { status: 401 })
  }

  try {
    const { lead, profile } = await request.json()

    const prompt = `You are a sales copywriter. Write a personalized, professional outreach draft from a business to a prospective customer, using only the information provided below. Do not invent facts. Do not claim to have personally researched the lead beyond what is given. Do not make exaggerated or false promises, and do not mention sending attachments or files. Keep the tone warm, brief, and professional — not pushy or salesy.

BUSINESS SENDING THE MESSAGE:
Name: ${profile?.business_name || 'Not provided'}
Products/services: ${profile?.products_services || 'Not provided'}
Description: ${profile?.business_description || 'Not provided'}

LEAD RECEIVING THE MESSAGE:
Name: ${lead.name || 'Not provided'}
Company: ${lead.company || 'Not provided'}
Industry: ${lead.industry || 'Not provided'}
Location: ${lead.location || 'Not provided'}
Notes: ${lead.notes || 'Not provided'}

Write two drafts:
1. A short WhatsApp-style message (casual, friendly, under 60 words)
2. A formal email with a subject line and body (professional, under 150 words)

Respond with ONLY valid JSON, no other text, in exactly this shape:
{
  "whatsapp_message": "...",
  "email_subject": "...",
  "email_body": "..."
}`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openrouter/free',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'AI request failed' }, { status: 500 })
    }

    const text = data.choices?.[0]?.message?.content || ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)

    return NextResponse.json({ result })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
