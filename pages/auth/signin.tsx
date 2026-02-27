// pages/auth/signin.tsx
import Link from 'next/link';
import { useState } from 'react';
import { getSession, getCsrfToken, signIn } from 'next-auth/react';

type SignInProps = {
  error: string | null;
};

export default function SignIn({ error }: SignInProps) {
  const [isLoading, setIsLoading] = useState(false);

  const errorMessages: Record<string, string> = {
    Signin: 'Try signing in with a different account.',
    OAuthSignin: 'Try signing in with a different account.',
    OAuthCallback: 'Try signing in with a different account.',
    OAuthCreateAccount: 'Try signing in with a different account.',
    EmailCreateAccount: 'Try signing in with a different account.',
    Callback: 'Try signing in with a different account.',
    OAuthAccountNotLinked:
      'To confirm your identity, sign in with the same account you used originally.',
    EmailSignin: 'The e-mail could not be sent.',
    CredentialsSignin:
      'Sign in failed. Check the email and password you entered.',
    SessionRequired: 'Please sign in to access this page.',
    default: 'Unable to sign in.',
  };

  const friendlyError = error
    ? errorMessages[error] || errorMessages.default
    : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    // signIn() handles CSRF automatically — no hidden token needed.
    // callbackUrl points to signin so getServerSideProps can route by role.
    await signIn('credentials', {
      email,
      password,
      callbackUrl: '/auth/signin',
    });

    // Note: setIsLoading(false) is intentionally omitted here because
    // signIn() will navigate away on success. On failure it redirects
    // back with ?error= and the page remounts fresh.
  }

  return (
    <main
      style={{
        maxWidth: 400,
        margin: '100px auto',
        padding: 30,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        minHeight: '60vh',
      }}
      aria-labelledby="signin-heading"
    >
      <h1
        id="signin-heading"
        style={{
          textAlign: 'center',
          color: '#FF7043',
          marginBottom: 30,
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        Welcome Back
      </h1>

      {friendlyError && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 8,
            background: '#FFEBEE',
            color: '#C62828',
            fontSize: 14,
          }}
        >
          {friendlyError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="email"
            style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label
            htmlFor="password"
            style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ textAlign: 'right', marginBottom: 18 }}>
          <Link
            href="/forgot-password"
            style={{ color: '#FF7043', fontSize: 13, fontWeight: 700 }}
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: 14,
            background: '#FF7043',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.8 : 1,
          }}
        >
          {isLoading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p
        style={{
          textAlign: 'center',
          marginTop: 24,
          color: '#666',
          fontSize: 13,
        }}
      >
        After signing in, you'll land on your personal dashboard.
      </p>
    </main>
  );
}

// ————————————————————————————————————————
// CORRECT REDIRECT LOGIC FOR ALL USER TYPES
// ————————————————————————————————————————
export async function getServerSideProps(context: any) {
  const session = await getSession(context);

  // Already logged in → send to the RIGHT dashboard
  if (session?.user) {
    const role = String((session.user as any).role || '').toUpperCase();

    if (role === 'RECRUITER') {
      return { redirect: { destination: '/recruiter/dashboard', permanent: false } };
    }
    if (role === 'COACH') {
      return { redirect: { destination: '/coaching-dashboard', permanent: false } };
    }
    if (role === 'ADMIN') {
      return { redirect: { destination: '/admin', permanent: false } };
    }

    // Default: Seeker (FREE / PRO)
    return { redirect: { destination: '/seeker-dashboard', permanent: false } };
  }

  // Not logged in → show sign-in form
  const { error = null } = context.query;

  return {
    props: {
      error: error ?? null,
    },
  };
}