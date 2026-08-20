'use client'

import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'

const statuses = ['New', 'Contacted', 'Responded', 'Interested', 'Negotiation', 'Won', 'Lost']

export default function Leads() {
  const [userId, setUserId] = useState(null)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        window.location.href = '/login'
        return
      }
      setUserId(userData.user.id)
      await loadLeads(userData.user.id)
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
            <div className="space-y-3">
              {leads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between border-b border-slate-100 pb-3">
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
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
