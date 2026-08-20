'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData?.user) {
        window.location.href = '/login'
        return
      }

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
      setLoading(false)
    }

    loadDashboard()
  }, [])

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
          <a href="/leads" className="rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm font-semibold hover:bg-indigo-700 transition">
            Manage Leads
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Leads" value={leads.length} />
          <StatCard label="High Priority" value="—" />
          <StatCard label="Interested" value={interested} />
          <StatCard label="Won" value={won} />
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
