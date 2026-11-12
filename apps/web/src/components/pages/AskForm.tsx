'use client'

import { useMemo, useState } from 'react'
import { createApiClient, type AskResponse } from '@elysia/api-client'
import { AskReport } from './AskReport'

const MESSAGES: Record<string, string> = {
  '400': 'Check the token address: it must be a valid 0x address.',
  '422': 'ELYSIA does not have enough data on this token, or it is younger than one hour. Try again later.',
  '429': 'Too many requests. Wait a little and try again.',
}

const ADDRESS = /^0x[0-9a-fA-F]{40}$/

// Ask is free: no payment, no wallet, no login.
export function AskForm({ apiUrl }: { apiUrl: string | undefined }) {
  const client = useMemo(() => createApiClient({ baseUrl: apiUrl }), [apiUrl])
  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AskResponse | null>(null)

  async function requestReport() {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      setResult(await client.ask({ address: address.trim() }))
    } catch (err) {
      const code = /HTTP (\d+)/.exec(err instanceof Error ? err.message : '')?.[1] ?? ''
      setError(MESSAGES[code] ?? 'Something went wrong. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <form
        className="pg-form"
        onSubmit={(e) => {
          e.preventDefault()
          void requestReport()
        }}
      >
        <label>
          <span className="k">Token address</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x…" required pattern="0x[0-9a-fA-F]{40}" spellCheck={false} autoComplete="off" />
        </label>
        <button className="btn btn-org" type="submit" disabled={busy || !ADDRESS.test(address.trim())}>
          {busy ? 'Working…' : 'Get the report '}
          <span className="ar">→</span>
        </button>
      </form>
      {error ? (
        <div className="pg-msg err" role="alert" style={{ marginTop: 16, maxWidth: 640 }}>
          {error}
        </div>
      ) : null}
      {result ? <AskReport result={result} /> : null}
    </>
  )
}
