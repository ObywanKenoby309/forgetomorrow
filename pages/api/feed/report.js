// pages/api/feed/report.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL || 'forgetomorrowteam@gmail.com';
const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.forgetomorrow.com';

// Parse FeedPost.content → { body, attachments[] }
function parseContent(content) {
  let body = '';
  let attachments = [];

  if (!content) return { body, attachments };

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.body === 'string') body = parsed.body;
        if (Array.isArray(parsed.attachments)) attachments = parsed.attachments;
      } else {
        body = content;
      }
    } catch {
      // plain text
      body = content;
    }
  }

  return { body, attachments };
}

// Primary transport: SMTP_* env (for moderation pipeline)
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { postId } = req.body || {};
  if (!postId) {
    return res.status(400).json({ error: 'postId is required' });
  }

  try {
    const post = await prisma.feedPost.findUnique({
      where: { id: Number(postId) },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const reporterId = session.user.id;
    const { body, attachments } = parseContent(post.content);
    const reportTimestamp = new Date();

    const postUrl = `${APP_BASE_URL}/feed#post-${post.id}`;

    const lines = [
      'A member of the ForgeTomorrow community has reported a post that may need moderation review.',
      '',
      `Report timestamp: ${reportTimestamp.toISOString()}`,
      `Original post timestamp: ${post.createdAt.toISOString()}`,
      '',
      `Reporter (userId): ${reporterId}`,
      `Post creator (authorId): ${post.authorId}`,
      '',
      `Post link: ${postUrl}`,
      '',
      'Post content:',
      body || '[no text body]',
    ];

    if (attachments.length) {
      lines.push(
        '',
        'Attachments (JSON):',
        JSON.stringify(attachments, null, 2)
      );
    }

    lines.push(
      '',
      'Recommended moderation process:',
      '1. Review message content in context (including attachments, if any).',
      '2. Compare potential issues against community guidelines and policies.',
      '3. If no violation is found:',
      '   - Record findings in the violation tracker for future reference.',
      '4. If a violation IS found:',
      '   - Record the time of review.',
      '   - Record which policy (or policies) the message violates.',
      '   - Delete or hide the post as appropriate.',
      '   - Notify the reporting member that review and any actions have been completed.',
      '   - Email the user whose account posted the content with details of the violation.',
      '   - Save the violation in the tracker for further review or escalation.'
    );

    const textBody = lines.join('\n');

    const smtpTransport = createSmtpTransport();
    const emailTransport = createEmailServerTransport();

    // Decide "from" address
    const fromAddress =
      process.env.SMTP_USER ||
      process.env.EMAIL_FROM ||
      process.env.EMAIL_USER ||
      'no-reply@forgetomorrow.com';

    let sent = false;

    // Try primary moderation transport first
    if (smtpTransport) {
      try {
        const info = await smtpTransport.sendMail({
          to: SUPPORT_EMAIL,
          from: `"ForgeTomorrow Moderation" <${fromAddress}>`,
          subject: 'COMMUNITY POST REPORT',
          text: textBody,
        });
        console.log('[FEED REPORT EMAIL SENT - SMTP_*]', info?.messageId || info);
        sent = true;
      } catch (mailErr) {
        console.error('[FEED REPORT EMAIL ERROR - SMTP_*]', mailErr);
      }
    }

    // Fallback to EMAIL_* transport if primary failed
    if (!sent && emailTransport) {
      try {
        const info = await emailTransport.sendMail({
          to: SUPPORT_EMAIL,
          from: `"ForgeTomorrow Moderation" <${fromAddress}>`,
          subject: 'COMMUNITY POST REPORT',
          text: textBody,
        });
        console.log(
          '[FEED REPORT EMAIL SENT - EMAIL_SERVER]',
          info?.messageId || info
        );
        sent = true;
      } catch (mailErr) {
        console.error('[FEED REPORT EMAIL ERROR - EMAIL_SERVER]', mailErr);
      }
    }

    if (!sent) {
      console.error('[FEED REPORT EMAIL NOT SENT - no transport succeeded]');
      // We still return 200 so the user sees confirmation;
      // internal logs will show what went wrong.
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[FEED REPORT ERROR]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
