// pages/api/support/tickets.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL || 'forgetomorrowteam@gmail.com';
const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.forgetomorrow.com';

// Primary transport: SMTP_* env (for moderation / support pipeline)
function createSmtpTransport() {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
}

// Fallback transport: EMAIL_* env (already used elsewhere in app)
function createEmailServerTransport() {
  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_USER) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id || null;
  const userEmail = session?.user?.email || null;

  if (req.method === 'GET') {
    if (!userId && !userEmail) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const tickets = await prisma.supportTicket.findMany({
        where: {
          OR: [
            userId ? { userId } : undefined,
            userEmail ? { userEmail } : undefined,
          ].filter(Boolean),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return res.status(200).json({ tickets });
    } catch (err) {
      console.error('Error fetching support tickets:', err);
      return res
        .status(500)
        .json({ error: 'Failed to fetch support tickets' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        subject,
        initialMessage,
        personaId,
        intent,
        source = 'support-chat',
      } = req.body || {};

      if (!subject || !initialMessage) {
        return res.status(400).json({
          error: 'subject and initialMessage are required',
        });
      }

      const ticket = await prisma.supportTicket.create({
        data: {
          subject,
          initialMessage,
          personaId,
          intent,
          source,
          status: 'OPEN',
          userId,
          userEmail,
        },
      });

      // ───────────────────────────────────────────────
      // Email notification to ForgeTomorrow team
      // ───────────────────────────────────────────────
      try {
        const smtpTransport = createSmtpTransport();
        const emailTransport = createEmailServerTransport();

        const fromAddress =
          process.env.SMTP_USER ||
          process.env.EMAIL_FROM ||
          process.env.EMAIL_USER ||
          'no-reply@forgetomorrow.com';

        const ticketUrl = `${APP_BASE_URL}/support`; // later can deep-link if needed

        const lines = [
          'A new support ticket has been created by a ForgeTomorrow member.',
          '',
          `Ticket ID: ${ticket.id}`,
          `Created at: ${ticket.createdAt.toISOString()}`,
          '',
          `User ID: ${userId || '[unknown]'}`,
          `User email: ${userEmail || '[unknown]'}`,
          '',
          `Persona (routed to): ${personaId || '[none]'}`,
          `Intent: ${intent || 'general'}`,
          `Source: ${source}`,
          '',
          `Subject: ${subject}`,
          '',
          'Initial message:',
          initialMessage,
          '',
          `Support Center: ${ticketUrl}`,
        ];

        const textBody = lines.join('\n');

        let sent = false;

        if (smtpTransport) {
          try {
            const info = await smtpTransport.sendMail({
              to: SUPPORT_EMAIL,
              from: `"ForgeTomorrow Support Desk" <${fromAddress}>`,
              subject: `NEW SUPPORT TICKET: ${subject}`,
              text: textBody,
            });
            console.log(
              '[SUPPORT TICKET EMAIL SENT - SMTP_*]',
              info?.messageId || info
            );
            sent = true;
          } catch (mailErr) {
            console.error(
              '[SUPPORT TICKET EMAIL ERROR - SMTP_*]',
              mailErr
            );
          }
        }

        if (!sent && emailTransport) {
          try {
            const info = await emailTransport.sendMail({
              to: SUPPORT_EMAIL,
              from: `"ForgeTomorrow Support Desk" <${fromAddress}>`,
              subject: `NEW SUPPORT TICKET: ${subject}`,
              text: textBody,
            });
            console.log(
              '[SUPPORT TICKET EMAIL SENT - EMAIL_SERVER]',
              info?.messageId || info
            );
            sent = true;
          } catch (mailErr) {
            console.error(
              '[SUPPORT TICKET EMAIL ERROR - EMAIL_SERVER]',
              mailErr
            );
          }
        }

        if (!sent) {
          console.error(
            '[SUPPORT TICKET EMAIL NOT SENT - no transport succeeded]'
          );
          // We still return 200 so the user sees confirmation;
          // internal logs will show what went wrong.
        }
      } catch (notifyErr) {
        console.error(
          '[SUPPORT TICKET EMAIL NOTIFICATION ERROR]',
          notifyErr
        );
        // Do not fail ticket creation if notification fails
      }

      return res.status(200).json({ ticket });
    } catch (err) {
      console.error('Error creating support ticket:', err);
      return res
        .status(500)
        .json({ error: 'Failed to create support ticket' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
