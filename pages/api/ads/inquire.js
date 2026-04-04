// pages/api/ads/inquire.js
import nodemailer from 'nodemailer';

const SALES_EMAIL = 'sales@forgetomorrow.com';
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.forgetomorrow.com';

function createSmtpTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

function createEmailServerTransport() {
  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_USER) return null;
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      contactName,
      contactEmail,
      companyName,
      companyWebsite,
      surfaces,
      budgetRange,
      notes,
    } = req.body || {};

    // Basic validation
    if (!contactName || !contactEmail || !companyName) {
      return res.status(400).json({
        error: 'contactName, contactEmail, and companyName are required',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const surfaceList = Array.isArray(surfaces) && surfaces.length > 0
      ? surfaces.join(', ')
      : 'Not specified';

    const lines = [
      'A new advertising inquiry has been submitted via ForgeTomorrow.',
      '',
      '────────────────────────────────────────',
      'CONTACT INFORMATION',
      '────────────────────────────────────────',
      `Name:     ${contactName}`,
      `Email:    ${contactEmail}`,
      `Company:  ${companyName}`,
      `Website:  ${companyWebsite || 'Not provided'}`,
      '',
      '────────────────────────────────────────',
      'ADVERTISING INTEREST',
      '────────────────────────────────────────',
      `Surfaces:       ${surfaceList}`,
      `Budget Range:   ${budgetRange || 'Not specified'}`,
      '',
      '────────────────────────────────────────',
      'NOTES',
      '────────────────────────────────────────',
      notes || 'No additional notes provided.',
      '',
      `Submitted at: ${new Date().toISOString()}`,
      `Source: ${APP_BASE_URL}/advertise`,
    ];

    const textBody = lines.join('\n');

    const htmlBody = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1a; color: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #FF7043 0%, #f4511e 100%); padding: 28px 32px;">
          <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.8); margin-bottom: 6px;">ForgeTomorrow Sales</div>
          <div style="font-size: 22px; font-weight: 800; color: #ffffff;">New Advertising Inquiry</div>
        </div>
        <div style="padding: 28px 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td colspan="2" style="padding: 0 0 16px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #FF7043; border-bottom: 1px solid rgba(255,112,67,0.3);">Contact Information</td></tr>
            <tr><td style="padding: 10px 0 4px; color: rgba(255,255,255,0.5); font-size: 12px; width: 120px;">Name</td><td style="padding: 10px 0 4px; color: #ffffff; font-weight: 600;">${contactName}</td></tr>
            <tr><td style="padding: 4px 0; color: rgba(255,255,255,0.5); font-size: 12px;">Email</td><td style="padding: 4px 0;"><a href="mailto:${contactEmail}" style="color: #FF7043; font-weight: 600;">${contactEmail}</a></td></tr>
            <tr><td style="padding: 4px 0; color: rgba(255,255,255,0.5); font-size: 12px;">Company</td><td style="padding: 4px 0; color: #ffffff; font-weight: 600;">${companyName}</td></tr>
            <tr><td style="padding: 4px 0 16px; color: rgba(255,255,255,0.5); font-size: 12px;">Website</td><td style="padding: 4px 0 16px; color: #ffffff;">${companyWebsite ? `<a href="${companyWebsite}" style="color: #FF7043;">${companyWebsite}</a>` : 'Not provided'}</td></tr>
            <tr><td colspan="2" style="padding: 16px 0 16px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #FF7043; border-top: 1px solid rgba(255,112,67,0.3); border-bottom: 1px solid rgba(255,112,67,0.3);">Advertising Interest</td></tr>
            <tr><td style="padding: 10px 0 4px; color: rgba(255,255,255,0.5); font-size: 12px;">Surfaces</td><td style="padding: 10px 0 4px; color: #ffffff; font-weight: 600;">${surfaceList}</td></tr>
            <tr><td style="padding: 4px 0 16px; color: rgba(255,255,255,0.5); font-size: 12px;">Budget</td><td style="padding: 4px 0 16px; color: #ffffff; font-weight: 600;">${budgetRange || 'Not specified'}</td></tr>
            ${notes ? `
            <tr><td colspan="2" style="padding: 16px 0 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #FF7043; border-top: 1px solid rgba(255,112,67,0.3);">Notes</td></tr>
            <tr><td colspan="2" style="padding: 0 0 16px; color: rgba(255,255,255,0.85); line-height: 1.6;">${notes.replace(/\n/g, '<br/>')}</td></tr>
            ` : ''}
          </table>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: rgba(255,255,255,0.35);">Submitted ${new Date().toLocaleString()} · ${APP_BASE_URL}/advertise</div>
        </div>
      </div>
    `;

    const fromAddress =
      process.env.SMTP_USER ||
      process.env.EMAIL_FROM ||
      process.env.EMAIL_USER ||
      'no-reply@forgetomorrow.com';

    const mailOptions = {
      to: SALES_EMAIL,
      from: `"ForgeTomorrow Advertising" <${fromAddress}>`,
      replyTo: contactEmail,
      subject: `AD INQUIRY: ${companyName} — ${surfaceList}`,
      text: textBody,
      html: htmlBody,
    };

    let sent = false;

    const smtpTransport = createSmtpTransport();
    if (smtpTransport) {
      try {
        const info = await smtpTransport.sendMail(mailOptions);
        console.log('[AD INQUIRY EMAIL SENT - SMTP_*]', info?.messageId);
        sent = true;
      } catch (err) {
        console.error('[AD INQUIRY EMAIL ERROR - SMTP_*]', err);
      }
    }

    if (!sent) {
      const emailTransport = createEmailServerTransport();
      if (emailTransport) {
        try {
          const info = await emailTransport.sendMail(mailOptions);
          console.log('[AD INQUIRY EMAIL SENT - EMAIL_SERVER]', info?.messageId);
          sent = true;
        } catch (err) {
          console.error('[AD INQUIRY EMAIL ERROR - EMAIL_SERVER]', err);
        }
      }
    }

    if (!sent) {
      console.error('[AD INQUIRY EMAIL NOT SENT - no transport succeeded]');
      // Still return 200 — inquiry is captured in logs, user sees confirmation
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[AD INQUIRY ERROR]', err);
    return res.status(500).json({ error: 'Failed to submit inquiry' });
  }
}