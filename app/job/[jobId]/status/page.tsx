'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function StatusSubpage() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    router.replace(`/job/${params.jobId}`)
  }, [params.jobId, router])

  return null
}
