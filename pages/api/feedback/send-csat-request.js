// pages/api/feedback/send-csat-request.js
// Sends a CSAT feedback request to a client.
//
// Internal flow (FT member):
//   - Sends a Signal message with a "Complete Feedback" CTA link
//   - Link goes to /feedback/[coachID] (authenticated internal page)
//   - Message body never shows the raw URL
//
// External flow (non-FT member):
//   - Sends an email via nodemailer with a "Complete Feedback" button
//   - Link goes to /feedback/public/[token] (public token-based page)
//   - Token is a signed JWT containing coachId (30-day expiry)
//   - Email includes a small fallback URL below the button
//
// POST body:
//   clientId?      (string) — FT userId for internal Signal message
//   clientEmail?   (string) — email address for external email
//   clientName     (string) — display name for personalization
//   mode           (string) — "internal" | "external"

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const TOKEN_SECRET = process.env.CSAT_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;
const APP_URL      = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://forgetomorrow.com';

function buildPublicToken(coachId) {
  return jwt.sign({ coachId }, TOKEN_SECRET, { expiresIn: '30d' });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const coachId = session.user.id;

  const { clientId, clientEmail, clientName, mode } = req.body || {};
  const cleanMode = mode === 'external' ? 'external' : 'internal';
  const cleanName = String(clientName || 'there').trim();

  // Load coach name for message personalization
  const coach = await prisma.user.findUnique({
    where: { id: coachId },
    select: { firstName: true, lastName: true, name: true },
  });

  const coachName = [coach?.firstName, coach?.lastName].filter(Boolean).join(' ') || coach?.name || 'Your coach';

  try {
    if (cleanMode === 'internal') {
      // ── Internal: send Signal message with CTA link ──────────────────────
      if (!clientId || typeof clientId !== 'string') {
        return res.status(400).json({ error: 'clientId is required for internal mode' });
      }

      // Verify target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: clientId },
        select: { id: true, deletedAt: true },
      });

      if (!targetUser || targetUser.deletedAt) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participants: { some: { userId: coachId } },
          AND:          { participants: { some: { userId: clientId } } },
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            isGroup: false,
            homeLocation: 'coach',
            participants: {
              create: [{ userId: coachId }, { userId: clientId }],
            },
          },
        });
      }

      // Build the internal feedback URL (no raw URL in the message body)
      const feedbackUrl = `${APP_URL}/feedback/${encodeURIComponent(coachId)}`;

      // Message uses a clean CTA format — no raw URL in the text body
      // The link is embedded as the CTA; the message body is human-readable
      const messageContent = `${coachName} has requested feedback regarding your coaching experience.\n\nComplete Feedback: ${feedbackUrl}`;

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId:       coachId,
          content:        messageContent,
        },
      });

      // Touch conversation updatedAt so it surfaces in thread list
      await prisma.conversation.update({
        where: { id: conversation.id },
        data:  { updatedAt: new Date() },
      });

      return res.status(200).json({ ok: true, mode: 'internal', conversationId: conversation.id });
    }

    if (cleanMode === 'external') {
      // ── External: send email with button CTA ────────────────────────────
      if (!clientEmail || typeof clientEmail !== 'string' || !clientEmail.includes('@')) {
        return res.status(400).json({ error: 'A valid clientEmail is required for external mode' });
      }

      const token       = buildPublicToken(coachId);
      const feedbackUrl = `${APP_URL}/feedback/public/${token}`;

      const transporter = nodemailer.createTransport({
        host:   process.env.SMTP_HOST,
        port:   Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Coaching Feedback Request</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:22px;font-weight:900;color:#FF7043;letter-spacing:-0.01em;">ForgeTomorrow</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:white;border-radius:14px;border:1px solid rgba(0,0,0,0.07);box-shadow:0 4px 20px rgba(0,0,0,0.07);padding:36px 32px;">

              <h1 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#334155;line-height:1.3;">
                Feedback requested
              </h1>

              <p style="margin:0 0 24px;font-size:15px;color:#64748B;line-height:1.6;">
                Hi ${cleanName},
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#64748B;line-height:1.6;">
                <strong style="color:#334155;">${coachName}</strong> has requested feedback regarding your coaching experience. Your input takes less than two minutes and helps improve the quality of coaching on ForgeTomorrow.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#FF7043;border-radius:10px;box-shadow:0 2px 8px rgba(255,112,67,0.3);">
                    <a href="${feedbackUrl}" target="_blank" style="display:inline-block;padding:13px 28px;color:white;font-weight:700;font-size:15px;text-decoration:none;letter-spacing:0.01em;">
                      Complete Feedback
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-size:12px;color:#94A3B8;line-height:1.6;">
                If the button does not work, copy and paste this link into your browser:
              </p>
              <p style="margin:0;font-size:11px;color:#94A3B8;word-break:break-all;">
                ${feedbackUrl}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;font-size:12px;color:#94A3B8;">
              You received this email because a ForgeTomorrow coach requested your feedback.<br/>
              © ${new Date().getFullYear()} ForgeTomorrow
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const emailText = `Hi ${cleanName},\n\n${coachName} has requested feedback regarding your coaching experience.\n\nComplete your feedback here:\n${feedbackUrl}\n\n© ${new Date().getFullYear()} ForgeTomorrow`;

      await transporter.sendMail({
        from:    `"ForgeTomorrow" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to:      clientEmail,
        subject: `${coachName} is requesting your feedback`,
        text:    emailText,
        html:    emailHtml,
      });

      return res.status(200).json({ ok: true, mode: 'external' });
    }

    return res.status(400).json({ error: 'Invalid mode' });
  } catch (err) {
    console.error('[feedback/send-csat-request] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
