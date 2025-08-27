// pages/cover/create.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
import { applyCoverTemplate } from '@/lib/templates/applyCoverTemplate';

// Small UI helpers (inline to avoid new components)
function Field({ label, children }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#607D8B' }}>{label}</label>
      {children}
    </div>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      style={{
        border: '1px solid #E0E0E0',
        borderRadius: 10,
        padding: '10px 12px',
        outline: 'none',
        ...props.style,
      }}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      style={{
        border: '1px solid #E0E0E0',
        borderRadius: 10,
        padding: '10px 12px',
        minHeight: 100,
        outline: 'none',
        ...props.style,
      }}
    />
  );
}

function GhostButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'white',
        border: '1px solid #E0E0E0',
        borderRadius: 10,
        padding: '8px 12px',
        fontWeight: 800,
        color: '#37474F',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: '#FF7043',
        color: 'white',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 10,
        padding: '10px 14px',
        fontWeight: 800,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

// Simple letter preview (center layout for printing later)
function CoverPreview({ fields }) {
  return (
    <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 12, padding: 24 }}>
      <div style={{ color: '#263238', fontSize: 14 }}>
        {/* Header block (optional contact / date) */}
        {fields.signatureContact && (
          <div style={{ marginBottom: 12, color: '#607D8B' }}>{fields.signatureContact}</div>
        )}

        {/* Recipient & greeting */}
        {(fields.recipient || fields.company) && (
          <div style={{ marginBottom: 6 }}>
            {fields.recipient && <div>{fields.recipient}</div>}
            {fields.company && <div>{fields.company}</div>}
          </div>
        )}

        <div style={{ margin: '12px 0' }}>{fields.greeting}</div>

        {/* Opening */}
        {fields.opening && <p style={{ margin: '8px 0' }}>{fields.opening}</p>}

        {/* Body bullets as short paragraphs */}
        {Array.isArray(fields.body) && fields.body.map((b, i) => (
          <p key={i} style={{ margin: '8px 0' }}>• {b}</p>
        ))}

        {/* Value proposition */}
        {fields.valueProp && <p style={{ margin: '8px 0' }}>{fields.valueProp}</p>}

        {/* Closing */}
        {fields.closing && <p style={{ margin: '12px 0' }}>{fields.closing}</p>}

        {/* Signoff */}
        <div style={{ margin: '12px 0' }}>
          {fields.signoff}
          <br />
          {fields.signatureName && <strong>{fields.signatureName}</strong>}
        </div>
      </div>
    </div>
  );
}

export default function CoverCreatePage() {
  const router = useRouter();
  const seededRef = useRef(false);

  // Cover letter state
  const [fields, setFields] = useState({
    recipient: "",
    company: "",
    role: "",
    greeting: "Dear Hiring Manager,",
    opening: "",
    body: [""],         // list of bullet/paragraph lines
    valueProp: "",
    closing: "",
    signoff: "Sincerely,",
    signatureName: "",
    signatureContact: "",
  });

  // Seed from ?template= only if currently blank
  useEffect(() => {
    const t = router.query?.template;
    if (!t || seededRef.current) return;

    const isBlank =
      !fields.opening &&
      (!fields.body || fields.body.every((l) => !l)) &&
      !fields.valueProp &&
      !fields.closing &&
      !fields.signatureName &&
      !fields.signatureContact;

    if (!isBlank) return;

    const profile = {
      name: "",       // wire from user later
      targetRole: "", // e.g., from job context
    };
    const doc = applyCoverTemplate(String(t), profile);
    if (doc?.fields) {
      setFields((prev) => ({ ...prev, ...doc.fields }));
      seededRef.current = true;
    }
  }, [router.query?.template]); // eslint-disable-line react-hooks/exhaustive-deps

  // Right rail
  const RightPane = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="creator" />

      {/* Quick actions */}
      <div
        style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 12,
          padding: 12,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          display: 'grid',
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 800, color: '#37474F' }}>Quick Actions</div>
        <GhostButton onClick={() => window.print?.()}>Print / Save PDF</GhostButton>
        <GhostButton onClick={() => alert('Tailor to JD coming soon')}>Tailor to Job (soon)</GhostButton>
      </div>
    </div>
  );

  // Header
  const HeaderBox = (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          color: '#FF7043',
          fontSize: 28,
          fontWeight: 800,
          margin: 0,
        }}
      >
        Cover Letter Builder
      </h1>
      <p style={{ marginTop: 8, color: '#546E7A', fontSize: 14 }}>
        Pick a template from the gallery, then fine-tune here. Exports and AI tailoring coming soon.
      </p>
    </section>
  );

  // Mutators
  const update = (key, val) => setFields((f) => ({ ...f, [key]: val }));
  const updateBody = (idx, val) =>
    setFields((f) => {
      const body = [...(f.body || [])];
      body[idx] = val;
      return { ...f, body };
    });
  const addBodyLine = () =>
    setFields((f) => ({ ...f, body: [...(f.body || []), ""] }));
  const removeBodyLine = (idx) =>
    setFields((f) => ({ ...f, body: (f.body || []).filter((_, i) => i !== idx) }));

  return (
    <SeekerLayout
      title="Create Cover Letter | ForgeTomorrow"
      header={HeaderBox}
      right={RightPane}
      activeNav="resume-cover"
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Editor */}
        <section
          style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            display: 'grid',
            gap: 12,
          }}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <Field label="Recipient name">
                <TextInput
                  placeholder="Jane Doe"
                  value={fields.recipient}
                  onChange={(e) => update('recipient', e.target.value)}
                />
              </Field>
              <Field label="Company">
                <TextInput
                  placeholder="Company XYZ"
                  value={fields.company}
                  onChange={(e) => update('company', e.target.value)}
                />
              </Field>
              <Field label="Role (optional)">
                <TextInput
                  placeholder="Customer Success Lead"
                  value={fields.role}
                  onChange={(e) => update('role', e.target.value)}
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
              <Field label="Greeting">
                <TextInput
                  placeholder="Dear Hiring Manager,"
                  value={fields.greeting}
                  onChange={(e) => update('greeting', e.target.value)}
                />
              </Field>
              <div />
            </div>

            <Field label="Opening">
              <TextArea
                placeholder="Open with intent and a clear, relevant statement."
                value={fields.opening}
                onChange={(e) => update('opening', e.target.value)}
              />
            </Field>

            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontWeight: 700, color: '#607D8B', fontSize: 12 }}>Body points</div>
              {(fields.body || []).map((line, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'start' }}>
                  <TextArea
                    placeholder={`Point ${idx + 1}`}
                    value={line}
                    onChange={(e) => updateBody(idx, e.target.value)}
                    style={{ minHeight: 60 }}
                  />
                  <GhostButton onClick={() => removeBodyLine(idx)}>Remove</GhostButton>
                </div>
              ))}
              <div><GhostButton onClick={addBodyLine}>Add point</GhostButton></div>
            </div>

            <Field label="Value proposition">
              <TextArea
                placeholder="Bring it together—how you’ll help them hit goals fast."
                value={fields.valueProp}
                onChange={(e) => update('valueProp', e.target.value)}
              />
            </Field>

            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
              <Field label="Closing">
                <TextArea
                  placeholder="Thank them and invite next steps."
                  value={fields.closing}
                  onChange={(e) => update('closing', e.target.value)}
                />
              </Field>
              <Field label="Signoff">
                <TextInput
                  placeholder="Sincerely,"
                  value={fields.signoff}
                  onChange={(e) => update('signoff', e.target.value)}
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
              <Field label="Your name">
                <TextInput
                  placeholder="Your Name"
                  value={fields.signatureName}
                  onChange={(e) => update('signatureName', e.target.value)}
                />
              </Field>
              <Field label="Contact (email · phone · LinkedIn)">
                <TextInput
                  placeholder="you@email.com · (555) 123-4567 · linkedin.com/in/you"
                  value={fields.signatureContact}
                  onChange={(e) => update('signatureContact', e.target.value)}
                />
              </Field>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <GhostButton onClick={() => window.print?.()}>Print / Save PDF</GhostButton>
              <PrimaryButton onClick={() => alert('Export coming soon')}>Export</PrimaryButton>
            </div>
          </div>
        </section>

        {/* Live preview */}
        <section
          style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontWeight: 800, color: '#37474F', marginBottom: 8 }}>Preview</div>
          <CoverPreview fields={fields} />
        </section>
      </div>
    </SeekerLayout>
  );
}
