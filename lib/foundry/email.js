// lib/foundry/email.js
// Email templates for Foundry invites.
// Uses the existing nodemailer setup from lib/email.js

import { sendEmail } from '@/lib/email';

export async function sendFoundryInviteEmail({
  to,
  toName,
  hostName,
  sessionTitle,
  dateStr,
  timezone,
  joinUrl,
}) {
  const subject = `${hostName} invited you to a Foundry session: ${sessionTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0b0d11;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0d11;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#141720;border-radius:14px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#0b0d11;padding:24px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="color:#FF7043;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:rgba(255,112,67,0.15);border:1px solid rgba(255,112,67,0.3);padding:4px 10px;border-radius:5px;">
                🔨 Foundry · ForgeTomorrow
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="color:#f0f0f0;font-size:20px;font-weight:700;margin:0 0 8px;">
                You're invited to a Foundry session
              </h1>
              <p style="color:#888;font-size:13px;margin:0 0 28px;line-height:1.6;">
                ${hostName} has invited you to join a live professional collaboration session on ForgeTomorrow.
              </p>

              <!-- Session details card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Session</p>
                    <p style="margin:0 0 16px;font-size:16px;color:#f0f0f0;font-weight:700;">${sessionTitle}</p>

                    <p style="margin:0 0 4px;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">When</p>
                    <p style="margin:0 0 16px;font-size:14px;color:#ccc;">${dateStr}</p>

                    <p style="margin:0 0 4px;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Host</p>
                    <p style="margin:0;font-size:14px;color:#ccc;">${hostName}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${joinUrl}" style="display:inline-block;background:#FF7043;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 32px;border-radius:8px;letter-spacing:0.01em;">
                      Join the Foundry
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#555;font-size:11px;text-align:center;margin:16px 0 0;line-height:1.6;">
                No account required. You'll be asked for your name when you join.<br>
                Or paste this link: <span style="color:#FF7043;">${joinUrl}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="color:#3a3a3a;font-size:11px;margin:0;line-height:1.6;">
                This invite was sent via ForgeTomorrow Foundry. If you weren't expecting this, you can safely ignore it.<br>
                <a href="https://forgetomorrow.com" style="color:#555;text-decoration:none;">forgetomorrow.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${hostName} invited you to a Foundry session: ${sessionTitle}

When: ${dateStr}
Host: ${hostName}

Join here: ${joinUrl}

No ForgeTomorrow account required. You'll enter your name when you join.

---
ForgeTomorrow · forgetomorrow.com
  `.trim();

  return sendEmail({ to, subject, html, text });
}
