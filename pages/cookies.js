import Head from "next/head";

export default function Cookies() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Head>
        <title>Cookies — ForgeTomorrow</title>
      <style>{`.skip-link{position:absolute;left:16px;top:-48px;background:#FF7043;color:#fff;padding:12px 16px;border-radius:8px;z-index:9999;text-decoration:none;font-weight:700}.skip-link:focus{top:16px}*:focus-visible{outline:3px solid #FFB199;outline-offset:3px}@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}`}</style></Head>
      <main id="main-content"
        className="max-w-4xl mx-auto px-6 py-10 text-slate-100"
        aria-labelledby="cookie-policy-heading"
      >
        <h1
          id="cookie-policy-heading"
          className="text-3xl font-bold text-[#FF7043] mb-4"
        >
          Cookie Policy
        </h1>
        <p className="text-slate-300">
          Details on cookie usage and preferences will be published here.
        </p>
      </main>
    </>
  );
}
