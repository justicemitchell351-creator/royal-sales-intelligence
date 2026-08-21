import { NextResponse } from 'next/server'
import { verifyUser } from '@/lib/verifyUser'

export async function POST(request) {
  const { user, error: authError } = await verifyUser(request)
  if (!user) {
    return NextResponse.json({ error: authError }, { status: 401 })
  }

  try {
    const body = await request.json()

    const prompt = `You are a sales intelligence analyst. Based on the following business information, create an Ideal Customer Profile (ICP).

Business name: ${body.business_name || 'Not provided'}
Industry: ${body.industry || 'Not provided'}
Location: ${body.location || 'Not provided'}
Products/services: ${body.products_services || 'Not provided'}
Price range: ${body.price_range || 'Not provided'}
Target customer type: ${body.target_customer_type || 'Not provided'}
Target geographic area: ${body.target_geographic_area || 'Not provided'}
Business description: ${body.business_description || 'Not provided'}
Main sales goal: ${body.main_sales_goal || 'Not provided'}

Only use the information given above. Do not invent specific facts that were not provided. If information is missing, make a reasonable general assumption and say so briefly.

Respond with ONLY valid JSON, no other text, in exactly this shape:
{
  "customer_type": "...",
  "industry": "...",
  "location": "...",
  "estimated_budget": "...",
  "likely_needs": "...",
  "buying_signals": "...",
  "pain_points": "...",
  "reasons_to_purchase": "...",
  "recommended_sales_approach": "..."
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
    const icp = JSON.parse(cleaned)

    return NextResponse.json({ icp })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
