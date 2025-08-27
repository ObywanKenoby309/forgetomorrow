// pages/recruiter/settings.js
import React from 'react';
import { useRouter } from 'next/router';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import { PlanProvider, usePlan } from '@/context/PlanContext';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Buttons';

function HeaderBar() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3 min-w-0">
      <div className="hidden md:block" />
      <div className="text-center min-w-0">
        <h1 className="text-2xl font-bold text-[#FF7043]">Organization Settings</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-xl mx-auto">
          Manage your company profile, seats, billing, brand, integrations, and compliance.
        </p>
      </div>
      <div className="justify-self-center md:justify-self-end">
        <div className="flex flex-wrap items-center gap-2">
          <SecondaryButton href="#invite">Invite User</SecondaryButton>
          <PrimaryButton href="#buy-seats">Buy Seats</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function RightSummaryCard() {
  const { isEnterprise } = usePlan();
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="font-medium mb-2">Account Summary</div>
      <div className="text-sm grid gap-2">
        <div><span className="text-slate-500">Plan:</span> {isEnterprise ? 'Recruiter — Enterprise' : 'Recruiter — SMB'}</div>
        <div><span className="text-slate-500">Seats:</span> 8 total • 7 assigned</div>
        <div><span className="text-slate-500">Renewal:</span> Jan 15, 2026</div>
        <div><span className="text-slate-500">Billing Email:</span> billing@companyxyz.com</div>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children, badge, ctaLabel = 'Manage', ctaHref = '#', disabled = false }) {
  return (
    <section className="rounded-lg border bg-white p-4 flex flex-col gap-3 relative">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
        </div>
        {badge && (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-[#FFEDE6] text-[#FF7043] border border-[#FFD2C2]">
            {badge}
          </span>
        )}
      </div>

      <div className="text-sm text-slate-700 grid gap-2">
        {children}
      </div>

      <div className="pt-1">
        <SecondaryButton
          href={disabled ? undefined : ctaHref}
          onClick={(e) => disabled && e.preventDefault()}
          className={disabled ? 'opacity-60 pointer-events-none' : ''}
        >
          {ctaLabel}
        </SecondaryButton>
      </div>
    </section>
  );
}

function SettingsGrid() {
  const { isEnterprise } = usePlan();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <Card title="Company Profile" subtitle="Basics that appear on job posts and your employer page." ctaHref="#company-profile">
        <div>Company XYZ • www.companyxyz.com</div>
        <div>Locations: Nashville, TN • Remote</div>
        <div>Industry: Health Tech</div>
        <div>Brand logo & colors configured</div>
      </Card>

      <Card title="Team & Seats" subtitle="Assign seats, invite teammates, and manage roles." ctaHref="#team-seats">
        <div>Seats: 8 total • 7 assigned • 1 available</div>
        <div>Roles: 2 Admins • 5 Recruiters • 3 Hiring Managers</div>
        <div>SSO: Not configured</div>
      </Card>

      <Card title="Billing" subtitle="Plan, payment method, and invoices." ctaHref="#billing">
        <div>Plan: {isEnterprise ? 'Recruiter — Enterprise' : 'Recruiter — SMB'}</div>
        <div>Payment: **** **** **** 4242 (Visa)</div>
        <div>Next renewal: Jan 15, 2026</div>
        <div>Invoices: 12 on file</div>
      </Card>

      <Card title="Jobs & Branding" subtitle="Defaults for job posts and employer branding." ctaHref="#jobs-branding">
        <div>Default Apply: In-platform apply</div>
        <div>Brand kit: Hero image, color, tone set</div>
        <div>Compliance text: EEOC statement on</div>
      </Card>

      <Card title="Clients (Agency Mode)" subtitle="Manage client organizations and post on their behalf." badge="Coming soon" ctaLabel="Preview" ctaHref="#clients-agency" disabled>
        <div>Create client orgs, route applicants, and share pipelines selectively.</div>
        <div>Enable data-sharing rules and client-facing reports.</div>
      </Card>

      <Card title="Integrations" subtitle="Connect ATS, Slack/email, webhooks, and SSO/SCIM." ctaHref="#integrations">
        <div>Slack alerts: On (messages & new applicants)</div>
        <div>ATS export: CSV + webhook configured</div>
        <div>SSO/SCIM: Available on Enterprise</div>
      </Card>

      <Card title="Notifications" subtitle="Control email and in-app notifications." ctaHref="#notifications">
        <div>New applicants: Instant</div>
        <div>Candidate messages: Instant</div>
        <div>Weekly digest: Mondays 9:00</div>
      </Card>

      <Card title="Compliance & Privacy" subtitle="Data retention, candidate consent, exports." ctaHref="#compliance">
        <div>Retention: 24 months (applicant data)</div>
        <div>Consent text: Enabled</div>
        <div>Exports/DSAR: Manual review required</div>
      </Card>

      {isEnterprise && (
        <Card title="Audit Log" subtitle="Track seat changes, role updates, job edits, exports." ctaHref="#audit-log">
          <div>Recent: Seat reassigned to jane@companyxyz.com</div>
          <div>Recent: Job “CSM Lead” edited by Omar (title & salary)</div>
          <div>Recent: Candidate export generated by Priya</div>
        </Card>
      )}
    </div>
  );
}

function NoAccessCard() {
  return (
    <div className="rounded-lg border bg-white p-6 text-center">
      <h2 className="text-lg font-semibold mb-1">You don’t have access to Settings</h2>
      <p className="text-sm text-slate-600 mb-4">
        Ask your organization’s admin for access, or return to the dashboard.
      </p>
      <SecondaryButton href="/recruiter/dashboard">Go to Dashboard</SecondaryButton>
    </div>
  );
}

function SettingsBody() {
  return (
    <div className="space-y-6 min-w-0">
      <SettingsGrid />
    </div>
  );
}

function SettingsPageInner({ role = 'recruiter' }) {
  const canView = role === 'owner' || role === 'admin' || role === 'billing';

  return (
    <RecruiterLayout
      title="ForgeTomorrow — Recruiter Settings"
      header={<HeaderBar />}
      right={<RightSummaryCard />}
      role={role}
      variant="enterprise"   // or 'smb' depending on the org; using enterprise so Audit Log shows in dev
    >
      {canView ? <SettingsBody /> : <NoAccessCard />}
    </RecruiterLayout>
  );
}

export default function RecruiterSettingsPage() {
  // Dev override: allow ?role=owner|admin|billing|recruiter|hiringManager
  const router = useRouter();
  const qRole = String(router?.query?.role || '').toLowerCase();
  const allowed = new Set(['owner','admin','billing','recruiter','hiringmanager']);
  const role = allowed.has(qRole) ? (qRole === 'hiringmanager' ? 'hiringManager' : qRole) : 'recruiter';

  return (
    <PlanProvider>
      <SettingsPageInner role={role} />
    </PlanProvider>
  );
}
