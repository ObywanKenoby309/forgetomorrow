// test-env.js
import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('GROQ_API_KEY loaded:', process.env.GROQ_API_KEY ? 'YES (starts with gsk_)' : 'NO — EMPTY OR MISSING');
console.log('Key length:', process.env.GROQ_API_KEY?.length || 'N/A');
console.log('Key preview (first 10):', process.env.GROQ_API_KEY?.slice(0, 10) || 'N/A');