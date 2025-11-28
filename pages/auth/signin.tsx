// pages/auth/signin.tsx 
import { getSession, getCsrfToken } from 'next-auth/react';

type SignInProps = {
  csrfToken: string | null;
  error: string | null;
};

export default function SignIn({ csrfToken, error }: SignInProps) {
  // Map NextAuth error codes → friendly message
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

  const hasError = Boolean(friendlyError);
  const errorId = hasError ? 'signin-error-message' : undefined;

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
          id={errorId}
          role="alert"
          aria-live="assertive"
          style={{
            marginBottom: 16,
            padding: '8px 10px',
            borderRadius: 8,
            background: '#FFEBEE',
            color: '#C62828',
            fontSize: 13,
          }}
        >
          {friendlyError}
        </div>
      )}

      {/* Credentials Form → NextAuth Credentials provider */}
      <form
        method="post"
        action="/api/auth/callback/credentials"
        aria-describedby={
          hasError ? errorId : undefined
        }
      >
        {/* Required CSRF token for NextAuth */}
        <input
          name="csrfToken"
          type="hidden"
          defaultValue={csrfToken ?? undefined}
        />

        {/* IMPORTANT: tell NextAuth where to send us AFTER sign-in */}
        <input
          name="callbackUrl"
          type="hidden"
          value="/seeker-dashboard" // ← CHANGED from "/auth/signin"
        />

        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="signin-email"
            style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}
          >
            Email
          </label>
          <input
            id="signin-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            aria-invalid={hasError ? 'true' : undefined}
            aria-describedby={hasError ? errorId : undefined}
            style={{
              width: '100%',
              padding: 12,
              marginTop: 4,
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label
            htmlFor="signin-password"
            style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}
          >
            Password
          </label>
          <input
            id="signin-password"
            name="password"
            type="password"
            placeholder="Your password"
            required
            autoComplete="current-password"
            aria-invalid={hasError ? 'true' : undefined}
            aria-describedby={hasError ? errorId : undefined}
            style={{
              width: '100%',
              padding: 12,
              marginTop: 4,
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
        After signing in, you&apos;ll be redirected to your ForgeTomorrow
        dashboard.
      </p>
    </main>
  );
}

export async function getServerSideProps(context: any) {
  // 1) If already logged in → send them to the right dashboard
  const session = await getSession(context);

  if (session?.user) {
    const rawPlan = (session.user as any).plan || '';
    const plan = String(rawPlan).toUpperCase();

    let destination = '/seeker-dashboard';

    if (plan.includes('COACH')) {
      destination = '/coaching-dashboard';
    } else if (plan.includes('RECRUIT')) {
      destination = '/recruiter/dashboard';
    }

    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  // 2) Not logged in → show the sign-in form
  const csrfToken = await getCsrfToken(context);
  const { error = null } = context.query;

  return {
    props: {
      csrfToken: csrfToken ?? null,
      error,
    },
  };
}
