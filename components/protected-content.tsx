'use client'

import { useSession } from '@supabase/auth-helpers-react'

export function ProtectedContent() {
  const session = useSession()

  if (!session) {
    return <div>Please log in to view this content</div>
  }

  return (
    <div>
      <h2>Welcome, {session.user.email}</h2>
      <p>This content is only visible to logged-in users.</p>
    </div>
  )
} 