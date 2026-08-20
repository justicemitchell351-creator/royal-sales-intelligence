'use client'

import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'

const statuses = ['New', 'Contacted', 'Responded', 'Interested', 'Negotiation', 'Won', 'Lost']

function scoreLabel(score) {
  if (score >= 94) return 'Excellent fit'
  if (score >= 80) return 'Strong fit'
  if (score >= 60) return 'Potential'
  if (score >= 40) return 'Weak'
  return 'Poor fit'
}

function scoreColor(score) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

export default function Leads() {
  const [userId, setUserId] = useState(null)
  const [profile, setProfile] = useState(null)
  const [icp, setIcp] = useState(null)
  const [leads, setLeads] = useState([])
  const [outreachMap, setOutreachMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [scoringId, setScoringId] = useState(null)
  const [outreachId, setOutreachId] = useState(null)

  useEffect(() => {
    async function init() {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        window.location.href = '/login'
        return
      }
      setUserId(userData.user.id)

      const { data: profileData } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle()
      setProfile(profileData || null)

      const { data: icpData } = await supabase
        .from('ideal_customer_profiles')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle()
      setIcp(icpData || null)

      await loadLeads(userData.user.id)
      await loadOutreach(userData.user.id)
      setLoading(false)
    }
    init()
  }, [])

  async function loadLeads(uid) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (!error) setLeads(data || [])
  }

  async function loadOutreach(uid) {
    const { data, error } = await supabase
      .from('outreach_messages')
      .select('*')
      .eq('user_id', uid)
    if (!error && data) {
      const map = {}
      data.forEach((row) => { map[row.lead_id] = row })
      setOutreachMap(map)
    }
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleAddLead() {
    if (!form.name && !form.company) {
      setMessage('Please enter at least a name or company.')
      return
    }
    setSaving(true)
    setMessage('')
    const { error } = await supabase.from('leads').insert({ user_id: userId, source: 'Manual', ...form })
    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setForm({})
      await loadLeads(userId)
      setMessage('Lead added!')
    }
    setSaving(false)
  }

  async function handleStatusChange(leadId, status) {
    await supabase.from('leads').update({ status }).eq('id', leadId)
    await loadLeads(userId)
  }

  async function handleScoreLead(lead) {
    if (!icp) {
      setMessage('Generate an Ideal Customer Profile on your dashboard first.')
      return
    }
    setScoringId(lead.id)
    setMessage('')
    try {
      const res = await fetch('/api/score-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, icp }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage('Error: ' + (data.error || 'Failed to score lead'))
        setScoringId(null)
        return
      }
      const { error } = await supabase
        .from('leads')
        .update({ ...data.result, scored_at: new Date().toISOString() })
        .eq('id', lead.id)
      if (error) {
        setMessage('Error saving score: ' + error.message)
      } else {
        await loadLeads(userId)
      }
    } catch (err) {
      setMessage('Error: ' + err.message)
    }
    setScoringId(null)
  }

  async function handleGenerateOutreach(lead) {
    setOutreachId(lead.id)
    setMessage('')
    try {
      const res = await fetch('/api/generate-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, profile }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage('Error: ' + (data.error || 'Failed to generate outreach'))
        setOutreachId(null)
        return
      }
      const { error } = await supabase
        .from('outreach_messages')
        .upsert({ user_id: userId, lead_id: lead.id, ...data.result }, { onConflict: 'lead_id' })
      if (error) {
        setMessage('Error saving message: ' + error.message)
      } else {
        setOutreachMap((prev) => ({ ...prev, [lead.id]: data.result }))
      }
    } catch (err) {
      setMessage('Error: ' + err.message)
    }
    setOutreachId(null)
  }

  function handleCsvUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setMessage('')
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data.map((row) => ({
          user_id: userId,
          name: row.name || null,
          company: row.company || null,
          industry: row.industry || null,
          location: row.location || null,
          website: row.website || null,
          email: row.email || null,
          phone: row.phone || null,
          notes: row.notes || null,
          source: 'CSV Upload',
        }))
        const { error } = await supabase.from('leads').insert(rows)
        if (error) {
          setMessage('Error uploading CSV: ' + error.message)
        } else {
          setMessage(`Uploaded ${rows.length} leads!`)
          await loadLeads(userId)
        }
        setUploading(false)
      },
      error: (err) => {
        setMessage('Error reading CSV: ' + err.message)
        setUploading(false)
      },
    })
    e.target.value = ''
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-slate-500">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Leads</h1>
          <a href="/dashboard" className="text-sm text-indigo-600 font-semibold">Back to dashboard</a>
        </div>

        {!icp && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 mb-6 text-sm text-amber-800">
            You haven&apos;t generated an Ideal Customer Profile yet. Go to your{' '}
            <a href="/dashboard" className="font-semibold underline">dashboard</a> and generate one before scoring leads.
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6">
          <h2 className="font-semibold mb-4">Add a lead</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <input placeholder="Name" value={form.name || ''} onChange={(e) => updateField('name', e.target.value)} className="rounded-lg border border-slate-300 px-4 py-2" />
            <input placeholder="Company" value={form.company || ''} onChange={(e) => updateField('company', e.target.value)} className="rounded-lg border border-slate-300 px-4 py-2" />
            <input placeholder="Industry" value={form.industry || ''} onChange={(e) => updateField('industry', e.target.value)} className="rounded-lg border border-slate-300 px-4 py-2" />
            <input placeholder="Location" value={form.location || ''} onChange={(e) => updateField('location', e.target.value)} className="rounded-lg border border-slate-300 px-4 py-2" />
            <input placeholder="Website" value={form.website || ''} onChange={(e) => updateField('website', e.target.value)} className="rounded-lg border border-slate-300 px-4 py-2" />
            <input placeholder="Email" value={form.email || ''} onChange={(e) => updateField('email', e.target.value)} className="rounded-lg border border-slate-300 px-4 py-2" />
            <input placeholder="Phone" value={form.phone || ''} onChange={(e) => updateField('phone', e.target.value)} className="rounded-lg border border-slate-300 px-4 py-2" />
            <input placeholder="Notes" value={form.notes || ''} onChange={(e) => updateField('notes', e.target.value)} className="rounded-lg border border-slate-300 px-4 py-2" />
          </div>
          <button
            type="button"
            onClick={handleAddLead}
            disabled={saving}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Lead'}
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6">
          <h2 className="font-semibold mb-2">Upload a CSV</h2>
          <p className="text-sm text-slate-500 mb-4">
            Columns: name, company, industry, location, website, email, phone, notes
          </p>
          <input type="file" accept=".csv" onChange={handleCsvUpload} disabled={uploading} />
          {uploading && <p className="text-sm text-slate-500 mt-2">Uploading...</p>}
        </div>

        {message && <p className="text-sm text-center text-slate-600 mb-6">{message}</p>}

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold mb-4">Your leads ({leads.length})</h2>
          {leads.length === 0 ? (
            <p className="text-sm text-slate-500">No leads yet. Add one above or upload a CSV.</p>
          ) : (
            <div className="space-y-5">
              {leads.map((lead) => {
                const outreach = outreachMap[lead.id]
                return (
                  <div key={lead.id} className="border-b border-slate-100 pb-5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{lead.name || lead.company || 'Unnamed lead'}</p>
                        <p className="text-xs text-slate-500">{lead.company}{lead.company && lead.location ? ' · ' : ''}{lead.location}</p>
                      </div>
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="text-sm rounded-lg border border-slate-300 px-2 py-1"
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {lead.score != null ? (
                      <div className="mt-2 space-y-1">
                        <p className={`font-bold ${scoreColor(lead.score)}`}>
                          {lead.score}/100 — {scoreLabel(lead.score)}
                        </p>
                        <p className="text-sm text-slate-700">{lead.score_reason}</p>
                        {lead.positive_signals && <p className="text-xs text-slate-500"><span className="font-semibold">Positive signals:</span> {lead.positive_signals}</p>}
                        {lead.missing_information && <p className="text-xs text-slate-500"><span className="font-semibold">Missing info:</span> {lead.missing_information}</p>}
                        {lead.potential_concerns && <p className="text-xs text-slate-500"><span className="font-semibold">Concerns:</span> {lead.potential_concerns}</p>}
                        {lead.recommended_next_action && <p className="text-xs text-slate-500"><span className="font-semibold">Next action:</span> {lead.recommended_next_action}</p>}
                        <button
                          type="button"
                          onClick={() => handleScoreLead(lead)}
                          disabled={scoringId === lead.id}
                          className="text-xs text-indigo-600 font-semibold disabled:opacity-50"
                        >
                          {scoringId === lead.id ? 'Rescoring...' : 'Rescore'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleScoreLead(lead)}
                        disabled={scoringId === lead.id || !icp}
                        className="mt-2 text-sm rounded-lg bg-indigo-600 px-3 py-1.5 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                      >
                        {scoringId === lead.id ? 'Scoring...' : 'Score this lead'}
                      </button>
                    )}

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => handleGenerateOutreach(lead)}
                        disabled={outreachId === lead.id}
                        className="text-sm rounded-lg border border-indigo-600 text-indigo-600 px-3 py-1.5 font-semibold hover:bg-indigo-50 transition disabled:opacity-50"
                      >
                        {outreachId === lead.id ? 'Generating...' : outreach ? 'Regenerate Outreach' : 'Generate Outreach'}
                      </button>
                    </div>

                    {outreach && (
                      <div className="mt-3 space-y-3">
                        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                          <p className="text-xs font-semibold text-green-700 mb-1">WhatsApp message</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{outreach.whatsapp_message}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Email · {outreach.email_subject}</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{outreach.email_body}</p>
                        </div>
                        <p className="text-xs text-slate-400">Review before sending — this is a draft only.</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
