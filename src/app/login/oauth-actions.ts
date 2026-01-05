'use client'

import { createSupabaseClient } from '@/lib/supabase'

export async function signInWithGoogle() {
  const supabase = createSupabaseClient()

  const result = await supabase.auth.signInWithOAuth({
    provider: 'google',
  })

  return result
}
