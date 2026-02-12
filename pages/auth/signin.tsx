// pages/auth/signin.tsx — UPDATED (adds outage notice banner)
import Link from 'next/link';
import { getSession, getCsrfToken } from 'next-auth/react';

type SignInProps = {
  csrfToken: string | null;
  error: string | null;
};

export default function SignIn({ csrfToken, error }: SignInProps) {
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

  return (
    <main
      style={{
        maxWidth: 400,
        margin: '100px auto',
        padding: 30,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}
      aria-labelledby="signin-heading"
    >
      <h1
        id="signin-heading"
        style={{
          textAlign: 'center',
          color: '#FF7043',
          marginBottom: 18,
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        Welcome Back
      </h1>

      {/* ✅ OUTAGE NOTICE (non-blocking, always visible) */}
      <div
        role="status"
        aria-live="polite"
        style={{
          marginBottom: 16,
          padding: '12px 14px',
          borderRadius: 10,
          background: 'rgba(255,112,67,0.10)',
          border: '1px solid rgba(255,112,67,0.30)',
          color: '#7C2D12',
          fontSize: 13,
          lineHeight: 1.35,
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 4 }}>
          Service Notice
        </div>
        <div>
          We are experiencing an issue related to our database hosting provider that is impacting
          multiple areas of the site, including user login. We are monitoring the situation and will
          provide updates on the{' '}
          <Link
            href="/status"
            style={{ color: '#FF7043', fontWeight: 800 }}
          >
            status page
          </Link>{' '}
          regularly.
        </div>
      </div>

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

      <form method="post" action="/api/auth/callback/credentials">
        <input name="csrfToken" type="hidden" defaultValue={csrfToken ?? ''} />

        {/* 🔁 After successful login, come back here so getServerSideProps can route by plan */}
        <input name="callbackUrl" type="hidden" value="/auth/signin" />

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

        {/* ✅ Forgot Password link (kept) */}
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

      <p
        style={{
          textAlign: 'center',
          marginTop: 24,
          color: '#666',
          fontSize: 13,
        }}
      >
        After signing in, you’ll land on your personal dashboard.
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
    const role = String((session.user as any).role || "").toUpperCase();
    const plan = String((session.user as any).plan || "").toUpperCase();

    // 1) Recruiter (SMALL_BIZ / ENTERPRISE)
    if (role === "RECRUITER") {
      return {
        redirect: {
          destination: "/recruiter/dashboard",
          permanent: false,
        },
      };
    }

    // 2) Coach
    if (role === "COACH") {
      return {
        redirect: {
          destination: "/coaching-dashboard",
          permanent: false,
        },
      };
    }

    // 3) Admin (optional)
    if (role === "ADMIN") {
      return {
        redirect: {
          destination: "/admin",
          permanent: false,
        },
      };
    }

    // 4) Default: Seeker (FREE / PRO)
    return {
      redirect: {
        destination: "/seeker-dashboard",
        permanent: false,
      },
    };
  }

  // Not logged in → show sign-in form
  const csrfToken = await getCsrfToken(context);
  const { error = null } = context.query;

  return {
    props: {
      csrfToken: csrfToken ?? null,
      error: error ?? null,
    },
  };
}
