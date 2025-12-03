// pages/auth/signin.tsx — FINAL FIXED VERSION (NO MORE LOOP)
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

      <form method="post" action="/api/auth/callback/credentials">
        <input name="csrfToken" type="hidden" defaultValue={csrfToken ?? ''} />

        {/* 🔁 After successful login, come back here so getServerSideProps can route by plan */}
        <input
          name="callbackUrl"
          type="hidden"
          value="/auth/signin"
        />

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

        <div style={{ marginBottom: 24 }}>
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
    const plan = String((session.user as any).plan || '').toUpperCase();

    if (plan.includes('COACH')) {
      return {
        redirect: {
          destination: '/coaching-dashboard',
          permanent: false,
        },
      };
    }
    if (plan.includes('RECRUIT')) {
      return {
        redirect: {
          destination: '/recruiter/dashboard',
          permanent: false,
        },
      };
    }

    // Default: seeker
    return {
      redirect: {
        destination: '/seeker-dashboard',
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
