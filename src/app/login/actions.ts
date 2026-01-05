'use client'

import { createSupabaseClient } from '@/lib/supabase'

export async function login(email: string, password: string) {
  const supabase = createSupabaseClient()

  const normalizedEmail = email.trim().toLowerCase()

  const result = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })

  return result
}
