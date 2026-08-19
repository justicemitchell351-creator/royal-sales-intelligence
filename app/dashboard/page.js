'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
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

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <p className="text-sm text-slate-500">Welcome back</p>
        <h1 className="text-2xl font-bold mb-8">{profile.business_name || 'Your Business'}</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Leads" value="0" />
          <StatCard label="High Priority" value="0" />
          <StatCard label="Interested" value="0" />
          <StatCard label="Won" value="0" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold mb-2">Top Prospects</h2>
          <p className="text-sm text-slate-500">
            No leads yet. Lead management is coming in the next phase.
          </p>
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
