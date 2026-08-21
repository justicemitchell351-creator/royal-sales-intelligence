import { createClient } from '@supabase/supabase-js'

export async function verifyUser(request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '')

  if (!token) {
    return { user: null, error: 'Missing authorization token' }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data?.user) {
    return { user: null, error: 'Invalid or expired session' }
  }

  return { user: data.user, error: null }
}
