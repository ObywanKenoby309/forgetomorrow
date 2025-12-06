// pages/settings.js
import Head from 'next/head';

export default function SettingsPage() {
  return (
    <>
      <Head>
        <title>Settings • ForgeTomorrow</title>
      </Head>

      <main className="min-h-screen bg-[#ECEFF1] pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Page header */}
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-[#263238]">
              Settings
            </h1>
            <p className="text-sm md:text-base text-[#546E7A]">
              Manage your account, privacy, and how your profile appears across ForgeTomorrow.
            </p>
          </header>

          {/* Account section */}
          <section className="bg-white rounded-2xl shadow-sm border border-[#CFD8DC] p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-[#263238]">
                Account
              </h2>
              <span className="text-xs uppercase tracking-wide text-[#B0BEC5]">
                Core
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#607D8B] uppercase">
                  Email
                </label>
                <p className="text-sm text-[#37474F] bg-[#ECEFF1] rounded-lg px-3 py-2">
                  {/* TODO: Replace with real user email from API */}
                  your.email@example.com
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#607D8B] uppercase">
                  Name
                </label>
                <p className="text-sm text-[#37474F] bg-[#ECEFF1] rounded-lg px-3 py-2">
                  {/* TODO: Replace with name from DB (read-only) */}
                  Unnamed (set during signup)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {/* TODO: Wire to password-change flow later */}
              <button
                type="button"
                className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium border border-[#CFD8DC] text-[#455A64] hover:bg-[#ECEFF1] transition"
              >
                Change password
              </button>

              {/* TODO: Wire to /api/auth/logout and redirect to /login */}
              <button
                type="button"
                className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold bg-[#FF7043] text-white hover:bg-[#F4511E] transition"
              >
                Log out
              </button>
            </div>
          </section>

          {/* Privacy & data */}
          <section className="bg-white rounded-2xl shadow-sm border border-[#CFD8DC] p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-[#263238]">
                Privacy &amp; data
              </h2>
              <span className="text-xs uppercase tracking-wide text-[#B0BEC5]">
                Compliance
              </span>
            </div>

            <div className="space-y-4">
              {/* Newsletter / marketing toggle placeholder */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#37474F]">
                    Email updates &amp; product news
                  </p>
                  <p className="text-xs text-[#78909C]">
                    Get occasional updates about new features, product changes,
                    and important account notices.
                  </p>
                </div>
                {/* TODO: Replace with real toggle wired to newsletter flag */}
                <button
                  type="button"
                  className="text-xs font-medium px-3 py-1 rounded-full border border-[#CFD8DC] text-[#455A64] hover:bg-[#ECEFF1] transition"
                >
                  Manage
                </button>
              </div>

              <hr className="border-[#ECEFF1]" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#37474F]">
                    Download my data
                  </p>
                  <p className="text-xs text-[#78909C]">
                    Request a copy of the personal data associated with your
                    ForgeTomorrow account.
                  </p>
                </div>
                {/* TODO: Wire to export-data endpoint later */}
                <button
                  type="button"
                  className="text-xs font-medium px-3 py-1 rounded-full border border-[#CFD8DC] text-[#455A64] hover:bg-[#ECEFF1] transition"
                >
                  Request export
                </button>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#37474F]">
                    Delete my account
                  </p>
                  <p className="text-xs text-[#78909C]">
                    Permanently delete your account and personal data, subject
                    to legal retention requirements.
                  </p>
                </div>
                {/* TODO: Wire to /api/privacy/delete with confirm modal */}
                <button
                  type="button"
                  className="text-xs font-semibold px-3 py-1 rounded-full border border-[#FFAB91] text-[#D84315] hover:bg-[#FFEBEE] transition"
                >
                  Delete account
                </button>
              </div>
            </div>
          </section>

          {/* Billing & subscription (new) */}
          <section className="bg-white rounded-2xl shadow-sm border border-[#CFD8DC] p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-[#263238]">
                Billing &amp; subscription
              </h2>
              <span className="text-xs uppercase tracking-wide text-[#B0BEC5]">
                Plan
              </span>
            </div>

            <div className="space-y-4">
              {/* Current plan summary – static for now */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#37474F]">
                    Current plan
                  </p>
                  <p className="text-xs text-[#78909C]">
                    {/* TODO: Replace with real plan name from session / DB */}
                    You&apos;re on the <span className="font-semibold">Seeker Free</span> plan.
                  </p>
                </div>
                {/* TODO: Wire this to Stripe billing portal or in-app upgrade flow */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-[#FF7043] text-white hover:bg-[#F4511E] transition"
                  >
                    Manage billing
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full text-xs font-medium border border-[#CFD8DC] text-[#455A64] hover:bg-[#ECEFF1] transition"
                  >
                    View plans
                  </button>
                </div>
              </div>

              <hr className="border-[#ECEFF1]" />

              {/* Invoices / receipts placeholder */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#37474F]">
                  Invoices &amp; receipts
                </p>
                <p className="text-xs text-[#78909C]">
                  {/* TODO: Replace with real invoice list once wired to Stripe */}
                  You&apos;ll see a history of your invoices and receipts here once billing is fully connected.
                  For now, reach out to{' '}
                  <a
                    href="mailto:support@forgetomorrow.com"
                    className="text-[#FF7043] hover:underline"
                  >
                    support@forgetomorrow.com
                  </a>{' '}
                  if you need help with a payment.
                </p>
              </div>
            </div>
          </section>

          {/* Appearance / avatar */}
          <section className="bg-white rounded-2xl shadow-sm border border-[#CFD8DC] p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-[#263238]">
                Profile appearance
              </h2>
              <span className="text-xs uppercase tracking-wide text-[#B0BEC5]">
                Profile
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-[auto,1fr] items-start">
              {/* Avatar preview */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-[#ECEFF1] overflow-hidden flex items-center justify-center">
                  {/* TODO: Replace src with real avatarUrl */}
                  <span className="text-lg font-semibold text-[#607D8B]">
                    EJ
                  </span>
                </div>
                {/* TODO: Wire to avatar upload API */}
                <label className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-medium border border-[#CFD8DC] text-[#455A64] hover:bg-[#ECEFF1] cursor-pointer transition">
                  <span>Upload avatar</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    // onChange={handleAvatarUpload}
                  />
                </label>
              </div>

              {/* Banner / visibility */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-[#37474F]">
                    Profile visibility
                  </p>
                  <p className="text-xs text-[#78909C] mb-2">
                    Control who can view your profile when sharing your public
                    link.
                  </p>
                  {/* TODO: Wire these buttons to isProfilePublic / recruiter-only mode */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#FF7043] text-white hover:bg-[#F4511E] transition"
                    >
                      Private
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-[#CFD8DC] text-[#455A64] hover:bg-[#ECEFF1] transition"
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-[#CFD8DC] text-[#455A64] hover:bg-[#ECEFF1] transition"
                    >
                      Recruiters only
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-[#37474F]">
                    Profile banner
                  </p>
                  <p className="text-xs text-[#78909C] mb-2">
                    Choose between a personal banner or your ForgeTomorrow staff
                    banner (if assigned).
                  </p>
                  {/* TODO: Wire to corporateBannerLocked / corporateBannerKey */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-[#CFD8DC] text-[#455A64] hover:bg-[#ECEFF1] transition"
                    >
                      Personal banner
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-[#FFAB91] text-[#D84315] hover:bg-[#FFF3E0] transition"
                    >
                      Company banner (locked)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Small compliance note for future you */}
          <p className="text-[10px] text-center text-[#B0BEC5] mt-4">
            Data controls shown here are for illustration. Final behavior will
            follow your GDPR / CCPA / LGPD policy wiring.
          </p>
        </div>
      </main>
    </>
  );
}
