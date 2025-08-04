import Head from 'next/head';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import PricingPlans from '../components/PricingPlans';

export default function Pricing() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow - Pricing</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <LandingHeader />

      <main
        role="main"
        aria-label="Pricing Plans for ForgeTomorrow"
        className="max-w-7xl mx-auto p-6 min-h-[80vh] my-20 sm:my-24 text-[#212121] bg-[#ECEFF1] rounded-lg shadow"
      >
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#FF7043] mb-4">Choose Your Plan</h1>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Flexible pricing designed to fit your needs — whether you're just starting out or scaling your hiring.
          </p>
        </section>

        <PricingPlans />
      </main>

      <LandingFooter />
    </>
  );
}
