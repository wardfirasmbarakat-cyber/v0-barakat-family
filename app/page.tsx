'use client'

import { useEffect, useState } from 'react'
import { PUBLIC_MEMBERS } from '@/lib/members'
import LoginScreen from '@/components/login-screen'
import Dashboard from '@/components/dashboard'

export default function Page() {
  const [member, setMember] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check')
        if (res.ok) {
          const data = await res.json()
          setMember(data.member)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="app">
      {member ? (
        <Dashboard me={member} />
      ) : (
        <LoginScreen members={PUBLIC_MEMBERS} />
      )}
    </div>
  )
}
