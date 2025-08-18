import Head from "next/head";

export default function Security() {
  return (
    <>
      <Head>
        <title>Security — ForgeTomorrow</title>
      </Head>
      <main className="max-w-4xl mx-auto px-6 py-10 text-slate-100">
        <h1 className="text-3xl font-bold text-[#FF7043] mb-4">Security</h1>
        <p className="text-slate-300">
          Overview of our security posture will appear here (data handling, certifications, and best practices).
        </p>
      </main>
    </>
  );
}
