// scripts/generate-vapid-keys.js
// Run once: node scripts/generate-vapid-keys.js
// Copy the output into your .env / Vercel environment variables.
// Never commit these keys to git.

const webpush = require('web-push');

const keys = webpush.generateVAPIDKeys();

console.log('\n=== VAPID Keys Generated ===\n');
console.log('Add these to your environment variables (.env.local and Vercel):\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:support@forgetomorrow.com`);
console.log('\nThe public key is safe to expose to the browser (NEXT_PUBLIC_ prefix).');
console.log('The private key must stay server-side only — never expose it to the client.\n');