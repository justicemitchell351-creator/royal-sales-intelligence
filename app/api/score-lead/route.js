import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { lead, icp } = await request.json()

    const prompt = `You are a sales intelligence analyst. Score how well this lead matches the business's Ideal Customer Profile (ICP).

IDEAL CUSTOMER PROFILE:
Customer Type: ${icp?.customer_type || 'Not available'}
Industry: ${icp?.industry || 'Not available'}
Location: ${icp?.location || 'Not available'}
Estimated Budget: ${icp?.estimated_budget || 'Not available'}
Likely Needs: ${icp?.likely_needs || 'Not available'}
Buying Signals: ${icp?.buying_signals || 'Not available'}

LEAD INFORMATION:
Name: ${lead.name || 'Not provided'}
Company: ${lead.company || 'Not provided'}
Industry: ${lead.industry || 'Not provided'}
Location: ${lead.location || 'Not provided'}
Website: ${lead.website || 'Not provided'}
Notes: ${lead.notes || 'Not provided'}

Score this lead from 0-100 based only on the information given above. Do not invent facts that were not provided. Use this scale as a guide: 94-100 Excellent fit, 80-93 Strong fit, 60-79 Potential, 40-59 Weak, 0-39 Poor fit. If key information is missing, reflect that honestly in the score and explain what's missing rather than guessing.

Respond with ONLY valid JSON, no other text, in exactly this shape:
{
  "score": 0,
  "score_reason": "...",
  "positive_signals": "...",
  "missing_information": "...",
  "potential_concerns": "...",
  "recommended_next_action": "..."
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
