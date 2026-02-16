// Edge Function: contact-email
// Invia email a info.altouritaly@gmail.com tramite Resend all'inserimento di un contatto
// Nota: NON inserire chiavi in repo. Configura le env su Supabase:
// RESEND_API_KEY, RESEND_FROM, RESEND_TO

// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

declare const Deno: { env: { get(name: string): string | undefined } } | undefined

type Payload =
  | {
      // Invocazione diretta dal client
      nome?: string
      email?: string
      messaggio?: string | null
      attivita?: string | null
    }
  | {
      // Webhook DB: struttura con record
      type?: string
      table?: string
      record?: {
        nome?: string
        email?: string
        messaggio?: string | null
        attivita?: string | null
        created_at?: string
      }
    }

function extractData(body: Payload) {
  // Supporta sia invocazione diretta che webhook
  const record =
    (body as any)?.record ??
    {
      nome: (body as any)?.nome,
      email: (body as any)?.email,
      messaggio: (body as any)?.messaggio ?? null,
      attivita: (body as any)?.attivita ?? null,
    }

  const nome = record?.nome ?? 'N/D'
  const email = record?.email ?? 'N/D'
  const messaggio = record?.messaggio ?? 'N/D'
  const attivita = record?.attivita ?? 'Sito Altour'

  return { nome, email, messaggio, attivita }
}

function buildEmail({ nome, email, messaggio, attivita }: ReturnType<typeof extractData>) {
  const subject = `Nuova richiesta contatto - ${attivita}`
  const text = [
    `Nome: ${nome}`,
    `Email: ${email}`,
    `Attività: ${attivita}`,
    '',
    'Messaggio:',
    `${messaggio}`,
  ].join('\n')
  return { subject, text }
}

async function sendWithResend({ subject, text }: { subject: string; text: string }) {
  const RESEND_API_KEY = Deno?.env?.get('RESEND_API_KEY')
  const RESEND_FROM = Deno?.env?.get('RESEND_FROM') ?? 'onboarding@resend.dev'
  const RESEND_TO = Deno?.env?.get('RESEND_TO') ?? 'info.altouritaly@gmail.com'

  if (!RESEND_API_KEY) {
    return new Response('Missing RESEND_API_KEY', { status: 500 })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [RESEND_TO],
      subject,
      text,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return new Response(`Send failed: ${err}`, { status: 502 })
  }
  return new Response('OK', { status: 200 })
}

serve(async (req: Request) => {
  try {
    const body = (await req.json()) as Payload
    const data = extractData(body)
    const email = buildEmail(data)
    return await sendWithResend(email)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(`Bad Request: ${msg}`, { status: 400 })
  }
})
