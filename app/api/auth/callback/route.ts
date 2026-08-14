import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error && data.session) {
        return NextResponse.redirect(`${origin}/dashboard`)
      }
    } catch (err) {
      console.error('Error exchanging OAuth code:', err)
    }
  }

  return NextResponse.redirect(`${origin}/dashboard?auth=demo`)
}
