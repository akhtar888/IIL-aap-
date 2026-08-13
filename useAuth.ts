import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

export type Role = 'student' | 'teacher' | 'admin'
export interface Profile {
  id: string; role: Role; name: string
  streak_count: number; last_practice_date: string | null
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      if (data.session?.user) await fetchProfile(data.session.user)
      setLoading(false)
    }
    load()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s?.user) fetchProfile(s.user)
      else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function fetchProfile(user: User) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data as Profile | null)
  }

  return { session, profile, loading, user: session?.user ?? null }
}
