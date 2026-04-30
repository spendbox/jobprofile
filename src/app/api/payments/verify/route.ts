export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { reference } = await req.json()
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 })

  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'Payment not configured' }, { status: 500 })

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  })

  const data = await res.json()
  if (!res.ok || data.data?.status !== 'success') {
    return NextResponse.json({ error: 'Payment not successful' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, amount: data.data.amount, currency: data.data.currency })
}
