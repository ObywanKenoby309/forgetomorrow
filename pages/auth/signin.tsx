// pages/auth/signin.tsx
import { getProviders, signIn, getSession, getCsrfToken } from 'next-auth/react';
import { GetServerSideProps } from 'next';

export default function SignIn({ providers, csrfToken }: any) {
  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 30, background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#FF7043', marginBottom: 30 }}>Welcome Back</h2>

      {/* Credentials Form */}
      <form method="post" action="/api/auth/callback/credentials">
        <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
        
        <div style={{ marginBottom: 16 }}>
          <label>Email</label>
          <input
            name="email"
            type="email"
            placeholder="admin@forgetomorrow.com"
            required
            style={{ width: '100%', padding: 12, marginTop: 6, borderRadius: 8, border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label>Password</label>
          <input
            name="password"
            type="password"
            placeholder="ChangeMe123!"
            required
            style={{ width: '100%', padding: 12, marginTop: 6, borderRadius: 8, border: '1px solid #ddd' }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: 14,
            background: '#FF7043',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Sign In
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 30, color: '#666' }}>
        This bypasses NextAuth’s broken default page on custom ports.
      </p>
    </div>
  );
}

export async function getServerSideProps(context: any) {
  const providers = await getProviders();
  const csrfToken = await getCsrfToken(context);

  return {
    props: { providers: providers ?? [], csrfToken },
  };
}