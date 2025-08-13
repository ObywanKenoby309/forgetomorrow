// pages/recruiter/upgrade.js
import Head from "next/head";
import Link from "next/link";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterHeader from "../../components/recruiter/RecruiterHeader";

function UpgradeBody() {
  const { isEnterprise } = usePlan();

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Upgrade to Enterprise</h1>

      {isEnterprise ? (
        <div className="rounded-md border bg-emerald-50 text-emerald-800 p-4">
          You’re already on Enterprise. 🎉
        </div>
      ) : (
        <>
          <div className="rounded-lg border bg-white p-5 space-y-4">
            <p className="text-slate-700">
              Enterprise unlocks the full recruiting suite so your team can hire faster and smarter.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Unlimited job postings</li>
              <li>AI‑powered candidate matching & ranking</li>
              <li>Full ATS workflow with automation & bulk actions</li>
              <li>Advanced analytics & source tracking</li>
              <li>Access to the Forge Talent Pool</li>
              <li>Up to 10 recruiter/admin seats</li>
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/billing/checkout?plan=enterprise"
              className="px-4 py-2 rounded bg-[#FF7043] hover:bg-[#F4511E] text-white text-sm"
            >
              Continue to Checkout
            </Link>
            <Link href="/recruiter/dashboard" className="text-sm underline">
              Back to Dashboard
            </Link>
          </div>

          <div className="text-xs text-slate-500">
            After checkout, Enterprise activates instantly. You can manage seats and roles in Settings.
          </div>
        </>
      )}
    </main>
  );
}

export default function UpgradePage() {
  return (
    <PlanProvider>
      <Head><title>Upgrade — ForgeTomorrow</title></Head>
      <RecruiterHeader />
      <UpgradeBody />
    </PlanProvider>
  );
}
