// pages/api/feed/report.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@forgetomorrow.com';
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

function createTransporter() {
  if (!process.env.SMTP_HOST) {
    throw new Error('SMTP not configured (SMTP_HOST missing)');
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
      'A member of the community has reported a post needing reviewed.',
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
      lines.push('', 'Attachments (JSON):', JSON.stringify(attachments, null, 2));
    }

    lines.push(
      '',
      'Please perform the following actions:',
      '1. Review message content',
      '2. Compare possible violations to community guidelines and policies',
      '3. Notify appropriate next-level parties as needed',
      '4. If message is determined to NOT violate community guidelines:',
      '   - Record findings in violation tracker for future review',
      '5. If message DOES violate community guidelines:',
      '   - Record time of review',
      '   - Record which policy the message is in violation of',
      '   - Delete post',
      '   - Notify member reporting that review and actions have been concluded',
      '   - Email user account of violation',
      '   - Save violation in tracker for further review'
    );

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        to: SUPPORT_EMAIL,
        from: SUPPORT_EMAIL,
        subject: 'COMMUNITY POST REPORT',
        text: lines.join('\n'),
      });
    } catch (mailErr) {
      console.error('[FEED REPORT EMAIL ERROR]', mailErr);
      // We still return 200 so user sees confirmation; logs will show issues.
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[FEED REPORT ERROR]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
