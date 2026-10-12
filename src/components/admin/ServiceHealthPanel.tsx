'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

type HealthState = 'healthy' | 'degraded' | 'down'

interface ServiceHealth {
  id: string
  label: string
  state: HealthState
  latencyMs: number
  detail: string
}

interface HealthReport {
  overall: HealthState
  summary: { healthy: number; degraded: number; down: number }
  services: ServiceHealth[]
}

const STATE_STYLE: Record<HealthState, { icon: typeof CheckCircle2; color: string; text: string }> = {
  healthy: { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', text: 'Healthy' },
  degraded: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', text: 'Degraded' },
  down: { icon: XCircle, color: 'text-red-600 dark:text-red-400', text: 'Down' },
}

const OVERALL_STYLE: Record<HealthState, { color: string; label: string }> = {
  healthy: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', label: 'All systems operational' },
  degraded: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', label: 'Some services degraded' },
  down: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: 'A service is down' },
}

/**
 * Live service health for the admin panel. Probes the database, storage, auth
 * and every gift option on demand rather than showing a constant, so a real
 * outage surfaces here.
 */
export function ServiceHealthPanel() {
  const [report, setReport] = useState<HealthReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkedAt, setCheckedAt] = useState<string>('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/health')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Health check failed (${res.status})`)
      }
      setReport(await res.json())
      setCheckedAt(new Date().toLocaleTimeString())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, 60_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={load} disabled={loading} className="btn btn-ghost text-sm" aria-label="Re-run health checks">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="ml-2">{loading ? 'Checking...' : 'Re-check'}</span>
        </button>
        {checkedAt ? <span className="text-sm muted-foreground">Checked {checkedAt}</span> : null}
        {report ? (
          <span className={`text-sm px-3 py-1 rounded-full ${OVERALL_STYLE[report.overall].color}`}>
            {OVERALL_STYLE[report.overall].label}
          </span>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600">Health check failed: {error}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading && !report
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-4 space-y-2">
                <div className="animate-pulse h-4 w-2/3 bg-stone-200 dark:bg-stone-700 rounded" />
                <div className="animate-pulse h-3 w-1/2 bg-stone-200 dark:bg-stone-700 rounded" />
              </div>
            ))
          : (report?.services || []).map((service) => {
              const style = STATE_STYLE[service.state]
              const Icon = style.icon
              return (
                <div key={service.id} className="card p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{service.label}</span>
                    <Icon className={`w-4 h-4 shrink-0 ${style.color}`} />
                  </div>
                  <p className={`text-sm ${style.color}`}>{style.text}</p>
                  <p className="text-xs muted-foreground">{service.detail}</p>
                  <p className="text-xs muted-foreground">{service.latencyMs}ms</p>
                </div>
              )
            })}
      </div>
    </div>
  )
}
