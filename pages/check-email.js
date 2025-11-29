import Head from 'next/head';

export default function CheckEmail() {
  return (
    <>
      <Head>
        <title>Check Your Email | ForgeTomorrow</title>
        <meta
          name="description"
          content="Confirm your email address to complete your ForgeTomorrow account setup."
        />
      </Head>

      <main
        className="flex items-center justify-center min-h-screen bg-[#ECEFF1] px-4"
        aria-labelledby="check-email-title"
        aria-live="polite"
      >
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1
            id="check-email-title"
            className="text-3xl font-bold text-[#FF7043] mb-4"
          >
            Check Your Email
          </h1>

          <p className="text-gray-600">
            We sent a confirmation link to your inbox.
          </p>

          <p className="text-sm text-gray-500 mt-4">
            Didn’t get it? Check spam or{' '}
            <a href="/pricing" className="text-[#FF7043] underline">
              resend the request
            </a>.
          </p>
        </div>
      </main>
    </>
  );
}
