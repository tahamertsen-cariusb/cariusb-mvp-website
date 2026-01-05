'use client'

import { createSupabaseClient } from '@/lib/supabase'

export async function signup(email: string, password: string) {
  const supabase = createSupabaseClient()

  const normalizedEmail = email.trim().toLowerCase()

  const result = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
  })

  return result
}
