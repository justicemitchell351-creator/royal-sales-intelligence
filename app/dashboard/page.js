'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const icpLabels = {
  customer_type: 'Customer Type',
  industry: 'Industry',
  location: 'Location',
  estimated_budget: 'Estimated Budget',
  likely_needs: 'Likely Needs',
  buying_signals: 'Buying Signals',
  pain_points: 'Pain Points',
  reasons_to_purchase: 'Reasons They May Purchase',
  recommended_sales_approach: 'Recommended Sales Approach',
}

export default function Dashboard() {
  const [userId, setUserId] = useState(null)
  const [profile, setProfile] = useState(null)
  const [leads, setLeads] = useState([])
  const [icp, setIcp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [generatingIcp, setGeneratingIcp] = useState(false)
  const [icpMessage, setIcpMessage] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData?.user) {
        window.location.href = '/login'
        return
      }
      setUserId(userData.user.id)

      const { data: profileData, error: profileError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (profileError) {
        setMessage('Error loading your business profile: ' + profileError.message)
        setLoading(false)
        return
      }

      if (!profileData) {
        window.location.href = '/onboarding'
        return
      }

      setProfile(profileData)

      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
      setLeads(leadsData || [])

      const { data: icpData } = await supabase
        .from('ideal_customer_profiles')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle()
      setIcp(icpData || null)

      setLoading(false)
    }

    loadDashboard()
  }, [])

  async function handleGenerateIcp() {
    setGeneratingIcp(true)
    setIcpMessage('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const res = await fetch('/api/generate-icp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData?.session?.access_token}`,
        },
        body: JSON.stringify(profile),
      })
      const data = await res.json()

      if (!res.ok) {
        setIcpMessage('Error: ' + (data.error || 'Failed to generate profile'))
        setGeneratingIcp(false)
        return
      }

      const { error } = await supabase
        .from('ideal_customer_profiles')
        .upsert({ user_id: userId, ...data.icp }, { onConflict: 'user_id' })

      if (error) {
        setIcpMessage('Error saving profile: ' + error.message)
      } else {
        setIcp(data.icp)
        setIcpMessage('')
      }
    } catch (err) {
      setIcpMessage('Error: ' + err.message)
    }
    setGeneratingIcp(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-slate-500">Loading...</p>
      </main>
    )
  }

  if (message) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-6">
        <p className="text-red-600 text-center">{message}</p>
      </main>
    )
  }

  const interested = leads.filter((l) => l.status === 'Interested').length
  const won = leads.filter((l) => l.status === 'Won').length

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-slate-500">Welcome back</p>
            <h1 className="text-2xl font-bold">{profile.business_name || 'Your Business'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/leads" className="rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm font-semibold hover:bg-indigo-700 transition">
              Manage Leads
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-slate-500 font-semibold hover:text-slate-700"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Leads" value={leads.length} />
          <StatCard label="High Priority" value="—" />
          <StatCard label="Interested" value={interested} />
          <StatCard label="Won" value={won} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Ideal Customer Profile</h2>
            <button
              type="button"
              onClick={handleGenerateIcp}
              disabled={generatingIcp}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {generatingIcp ? 'Generating...' : icp ? 'Regenerate' : 'Generate Profile'}
            </button>
          </div>
          {icpMessage && <p className="text-sm text-red-600 mb-4">{icpMessage}</p>}
          {!icp && !generatingIcp && (
            <p className="text-sm text-slate-500">
              No profile yet. Tap &quot;Generate Profile&quot; to have the AI analyze your business.
            </p>
          )}
          {icp && (
            <div className="space-y-3">
              {Object.entries(icpLabels).map(([key, label]) => (
                icp[key] ? (
                  <div key={key}>
                    <p className="text-xs font-semibold text-slate-500">{label}</p>
                    <p className="text-sm text-slate-700">{icp[key]}</p>
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold mb-2">Recent Leads</h2>
          {leads.length === 0 ? (
            <p className="text-sm text-slate-500">
              No leads yet. <a href="/leads" className="text-indigo-600 font-semibold">Add your first lead</a>.
            </p>
          ) : (
            <div className="space-y-2">
              {leads.slice(0, 5).map((lead) => (
                <div key={lead.id} className="flex justify-between text-sm">
                  <span>{lead.name || lead.company || 'Unnamed lead'}</span>
                  <span className="text-slate-500">{lead.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
