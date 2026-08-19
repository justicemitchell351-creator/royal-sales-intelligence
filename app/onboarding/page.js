'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const fields = [
  { key: 'business_name', label: 'Business name' },
  { key: 'industry', label: 'Industry' },
  { key: 'location', label: 'Location' },
  { key: 'products_services', label: 'Products / services' },
  { key: 'price_range', label: 'Price range' },
  { key: 'target_customer_type', label: 'Target customer type' },
  { key: 'target_geographic_area', label: 'Target geographic area' },
  { key: 'business_description', label: 'Business description' },
  { key: 'main_sales_goal', label: 'Main sales goal' },
]

export default function Onboarding() {
  const [form, setForm] = useState({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setLoading(true)
    setMessage('')

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
      setMessage('Error: You must be logged in. Please log in first.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('business_profiles')
      .upsert({ user_id: userData.user.id, ...form }, { onConflict: 'user_id' })

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Business profile saved!')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="w-full max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-center mb-2">Tell us about your business</h1>
        <p className="text-sm text-slate-500 text-center mb-8">
          This helps us build your Ideal Customer Profile.
        </p>
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {field.label}
              </label>
              <input
                type="text"
                value={form[field.key] || ''}
                onChange={(e) => updateField(field.key, e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Business Profile'}
          </button>
        </div>
        {message && (
          <p className="mt-4 text-sm text-center text-slate-600">{message}</p>
        )}
      </div>
    </main>
  )
}
