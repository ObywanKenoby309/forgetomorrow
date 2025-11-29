// pages/auth/error.tsx
import Head from "next/head";
import Link from "next/link";

type ErrorPageProps = {
  error: string | null;
};

const ERROR_MESSAGES: Record<string, string> = {
  Signin: "There was a problem signing you in. Try a different account or method.",
  OAuthSignin: "There was a problem with the external provider. Please try again.",
  OAuthCallback: "We could not complete the sign-in with your provider.",
  OAuthCreateAccount: "We could not create an account with that provider.",
  EmailCreateAccount: "We could not create an account with that email.",
  EmailSignin: "The sign-in email could not be sent.",
  CredentialsSignin:
    "Sign in failed. Check the email and password you entered and try again.",
  SessionRequired: "Please sign in to access this page.",
  OAuthAccountNotLinked:
    "To confirm your identity, sign in with the same account you used originally.",
  default: "Something went wrong during sign-in. Please try again.",
};

export default function AuthErrorPage({ error }: ErrorPageProps) {
  const message = error ? ERROR_MESSAGES[error] || ERROR_MESSAGES.default : ERROR_MESSAGES.default;

  return (
    <>
      <Head>
        <title>Sign-in Error | ForgeTomorrow</title>
        <meta
          name="description"
          content="There was a problem signing you in to ForgeTomorrow."
        />
      </Head>

      <main
        aria-labelledby="auth-error-heading"
        style={{
          maxWidth: 420,
          margin: "100px auto",
          padding: 30,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          id="auth-error-heading"
          style={{
            textAlign: "center",
            color: "#FF7043",
            marginBottom: 24,
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          Sign-in Error
        </h1>

        <div
          role="alert"
          aria-live="polite"
          style={{
            marginBottom: 16,
            padding: "10px 12px",
            borderRadius: 8,
            background: "#FFEBEE",
            color: "#C62828",
            fontSize: 13,
          }}
        >
          {message}
        </div>

        <p style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
          If this keeps happening, you can:
        </p>

        <ul
          style={{
            fontSize: 13,
            color: "#555",
            marginBottom: 20,
            paddingLeft: 18,
          }}
        >
          <li>Double-check your email and password.</li>
          <li>Try signing in again from the main sign-in page.</li>
          <li>Use the same provider you originally used for this account.</li>
        </ul>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 10,
          }}
        >
          <Link
            href="/auth/signin"
            aria-label="Return to the ForgeTomorrow sign-in page"
            style={{
              display: "inline-block",
              textAlign: "center",
              padding: "12px 14px",
              background: "#FF7043",
              color: "#fff",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Back to Sign In
          </Link>

          <Link
            href="/"
            aria-label="Go to the ForgeTomorrow home page"
            style={{
              display: "inline-block",
              textAlign: "center",
              padding: "10px 12px",
              background: "#ECEFF1",
              color: "#444",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go to Home
          </Link>
        </div>

        <p
          style={{
            marginTop: 20,
            fontSize: 12,
            color: "#888",
            textAlign: "center",
          }}
        >
          If you think this is a mistake, contact support at{" "}
          <a
            href="mailto:support@forgetomorrow.com"
            style={{ color: "#FF7043", textDecoration: "underline" }}
          >
            support@forgetomorrow.com
          </a>
          .
        </p>
      </main>
    </>
  );
}

export async function getServerSideProps(context: any) {
  const { error = null } = context.query;

  return {
    props: {
      error,
    },
  };
}
