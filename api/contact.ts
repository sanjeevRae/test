import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'

const TO = process.env.FORM_TO || 'sanzeeprae@gmail.com'

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const user = process.env.ZOHO_SMTP_USER
  const pass = process.env.ZOHO_SMTP_PASS
  if (!user || !pass) {
    return res
      .status(500)
      .json({ ok: false, error: 'Mail is not configured yet' })
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  const name = clean(body.name, 120)
  const phone = clean(body.phone, 40)
  const email = clean(body.email, 160)
  const subject = clean(body.subject, 120) || 'Visit enquiry'
  const message = clean(body.message, 4000)

  if (
    !name ||
    !email ||
    !message ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return res
      .status(400)
      .json({ ok: false, error: 'Missing or invalid fields' })
  }

  const transporter = nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST || 'smtppro.zoho.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  })

  const text = [
    'New enquiry from the Bodhisattva exhibition website',
    '',
    `Name: ${name}`,
    `Phone: ${phone || 'Not provided'}`,
    `Email: ${email}`,
    `Subject: ${subject}`,
    '',
    'Message:',
    message,
  ].join('\n')

  try {
    await transporter.sendMail({
      from: { name: 'Bodhisattva Exhibition Website', address: user },
      to: TO,
      replyTo: email,
      subject: `Website enquiry — ${subject}`,
      text,
    })
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('contact send failed', error)
    return res.status(500).json({ ok: false, error: 'Could not send' })
  }
}
