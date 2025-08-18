// pages/settings.js
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

const TABS = [
  { key: "account", label: "Account" },
  { key: "notifications", label: "Notifications" },
  { key: "privacy", label: "Privacy & Data" },
];

export default function Settings() {
  const router = useRouter();
  const tab = typeof router.query.tab === "string" ? router.query.tab : "account";
  const [active, setActive] = useState(TABS.some(t => t.key === tab) ? tab : "account");

  useEffect(() => {
    if (typeof tab === "string" && TABS.some(t => t.key === tab)) {
      setActive(tab);
    }
  }, [tab]);

  const onTab = (key) => {
    const url = { pathname: "/settings", query: key === "account" ? {} : { tab: key } };
    router.push(url, undefined, { shallow: true });
  };

  return (
    <>
      <Head>
        <title>Settings — ForgeTomorrow</title>
      </Head>

      <main className="max-w-5xl mx-auto px-6 py-8 text-slate-100">
        <h1 className="text-3xl font-bold text-[#FF7043] mb-6">Settings</h1>

        {/* Tabs */}
        <div className="mb-6 border-b border-white/10">
          <nav className="flex gap-6 text-sm">
            {TABS.map((t) => {
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => onTab(t.key)}
                  className={`pb-3 -mb-px border-b-2 transition ${
                    isActive
                      ? "border-[#FF7043] text-white"
                      : "border-transparent text-slate-300 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Panels */}
        {active === "account" && <AccountPanel />}
        {active === "notifications" && <NotificationsPanel />}
        {active === "privacy" && <PrivacyPanel />}
      </main>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section className="bg-black/40 rounded-lg p-5 border border-white/10 mb-6">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm text-slate-300 mb-1">
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-md bg-white/90 text-slate-900 px-3 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
    />
  );
}

function Toggle({ id, checked, onChange, label, helper }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-medium text-sm">{label}</label>
        {helper && <p className="text-xs text-slate-300 mt-1">{helper}</p>}
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-[#FF7043]"
      />
    </div>
  );
}

/* --- Panels --- */

function AccountPanel() {
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // TODO: POST to /api/settings/account
      await new Promise((r) => setTimeout(r, 600));
      alert("Account settings saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save}>
      <Section title="Profile">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="headline">Headline</Label>
            <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
        </div>
      </Section>

      <Section title="Security">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <div>
            <Label htmlFor="password2">Confirm Password</Label>
            <Input id="password2" type="password" placeholder="••••••••" />
          </div>
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#FF7043] hover:bg-[#F4511E] text-white font-semibold px-5 py-2 rounded-md"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function NotificationsPanel() {
  const [emailApp, setEmailApp] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [productNews, setProductNews] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // TODO: POST to /api/settings/notifications
      await new Promise((r) => setTimeout(r, 500));
      alert("Notification preferences saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save}>
      <Section title="Email Notifications">
        <div className="space-y-4">
          <Toggle
            id="emailApp"
            checked={emailApp}
            onChange={setEmailApp}
            label="Account & activity emails"
            helper="Security alerts, account changes, application updates."
          />
          <Toggle
            id="emailDigest"
            checked={emailDigest}
            onChange={setEmailDigest}
            label="Weekly activity digest"
            helper="A summary of views, messages, and job activity."
          />
          <Toggle
            id="productNews"
            checked={productNews}
            onChange={setProductNews}
            label="Product news & tips"
            helper="Occasional updates about new features."
          />
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#FF7043] hover:bg-[#F4511E] text-white font-semibold px-5 py-2 rounded-md"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function PrivacyPanel() {
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [searchable, setSearchable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState("");

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // TODO: POST to /api/settings/privacy
      await new Promise((r) => setTimeout(r, 500));
      alert("Privacy settings saved.");
    } finally {
      setSaving(false);
    }
  };

  const confirm = async (message) => {
    if (typeof window === "undefined") return false;
    return window.confirm(message);
  };

  const exportData = async () => {
    setBusyAction("export");
    try {
      // TODO: GET /api/me/export (stream file)
      await new Promise((r) => setTimeout(r, 700));
      alert("Data export started. You’ll receive a download when it’s ready.");
    } finally {
      setBusyAction("");
    }
  };

  const deleteDataKeepAccount = async () => {
    const ok = await confirm(
      "Delete your personal data but keep your account?\n\nThis will remove your content and personal info (where allowed) but preserve your login so you can start fresh. This action cannot be undone."
    );
    if (!ok) return;
    setBusyAction("deleteData");
    try {
      // TODO: POST /api/me/delete-data (soft data purge, keep account)
      await new Promise((r) => setTimeout(r, 1000));
      alert("Your data has been queued for deletion. This may take some time to complete.");
    } finally {
      setBusyAction("");
    }
  };

  const deleteAccount = async () => {
    const ok = await confirm(
      "Permanently delete your account and all associated data?\n\nThis cannot be undone and will sign you out everywhere."
    );
    if (!ok) return;
    setBusyAction("deleteAccount");
    try {
      // TODO: POST /api/me/delete-account (full erasure)
      await new Promise((r) => setTimeout(r, 1200));
      alert("Your account has been scheduled for deletion.");
    } finally {
      setBusyAction("");
    }
  };

  return (
    <>
      <form onSubmit={save}>
        <Section title="Visibility">
          <div className="space-y-4">
            <Toggle
              id="profileVisible"
              checked={profileVisibility}
              onChange={setProfileVisibility}
              label="Public profile"
              helper="If off, only approved connections and recruiters you apply to can view your profile."
            />
            <Toggle
              id="searchable"
              checked={searchable}
              onChange={setSearchable}
              label="Search engine indexing"
              helper="Allow search engines to index your public profile."
            />
          </div>
        </Section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#FF7043] hover:bg-[#F4511E] text-white font-semibold px-5 py-2 rounded-md"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>

      <Section title="Your Data">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportData}
            disabled={busyAction === "export"}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md text-sm"
          >
            {busyAction === "export" ? "Preparing export…" : "Export my data"}
          </button>

        <button
            onClick={deleteDataKeepAccount}
            disabled={busyAction === "deleteData"}
            className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-md text-sm"
          >
            {busyAction === "deleteData" ? "Deleting data…" : "Delete my data (keep account)"}
          </button>

          <button
            onClick={deleteAccount}
            disabled={busyAction === "deleteAccount"}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md text-sm"
          >
            {busyAction === "deleteAccount" ? "Deleting account…" : "Delete my account"}
          </button>
        </div>

        <p className="text-xs text-slate-300 mt-3">
          Note: “Delete my data (keep account)” attempts to remove or anonymize your personal data and content while preserving your login so you can continue using the service. Some records may be retained where legally required (e.g., billing, security logs).
        </p>
      </Section>
    </>
  );
}
