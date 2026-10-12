import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { requireAdmin } from '@/lib/api/authGuard'
import { checkAll } from '@/lib/health/checks'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SLOW_MS = 2500

export async function GET(request: NextRequest) {
  noStore()

  const adminId = await requireAdmin(request)
  if (!adminId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SLOW_MS + 500)

  try {
    // The endpoint itself must stay fast, or the dashboard blocks on it.
    const report = await Promise.race([
      checkAll(),
      new Promise<{ overall: 'down'; summary: { down: number }; services: [] }>((resolve) =>
        setTimeout(() => resolve({ overall: 'down', summary: { down: 1 }, services: [] }), SLOW_MS)
      ),
    ])

    clearTimeout(timer)

    const status = report.overall === 'healthy' ? 200 : report.overall === 'degraded' ? 200 : 503

    return NextResponse.json(report, { status, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    clearTimeout(timer)
    return NextResponse.json(
      { overall: 'down', error: 'Health check failed', services: [] },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
