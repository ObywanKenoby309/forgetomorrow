import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';

const ORANGE = '#FF7043';

function safeArr(v) {
  return Array.isArray(v) ? v.filter(Boolean) : [];
}

function asTextBlock(label, value) {
  if (!value) return '';
  return `${label}\n${value}\n`;
}

function asBullets(label, items) {
  const arr = safeArr(items);
  if (!arr.length) return '';
  return `${label}\n${arr.map((x) => `• ${String(x)}`).join('\n')}\n`;
}

function buildPdfText(plan, formData) {
  const lines = [];

  lines.push('ForgeTomorrow — Offer & Negotiation Guidance');
  lines.push(''); // spacer

  lines.push('User Inputs (snapshot)');
  lines.push(`- Current Title: ${formData?.currentJobTitle || 'N/A'}`);
  lines.push(`- Location: ${formData?.location || 'N/A'}`);
  lines.push(`- Current Salary: ${formData?.currentSalary || 'N/A'}`);
  lines.push(`- New Job?: ${formData?.isNewJob === 'yes' ? 'Yes' : 'No'}`);
  lines.push(`- Target Range: ${formData?.targetSalaryMin || 'N/A'} to ${formData?.targetSalaryMax || 'N/A'}`);
  lines.push('');

  if (plan?.disclaimer?.summary) {
    lines.push('Disclaimer');
    lines.push(plan.disclaimer.summary);
    lines.push('');
  }
  if (plan?.disclaimer?.mentorNote) {
    lines.push('Mentor Note');
    lines.push(plan.disclaimer.mentorNote);
    lines.push('');
  }

  lines.push(asTextBlock('Role Context', [
    plan?.roleContext?.interpretedRole ? `Interpreted role: ${plan.roleContext.interpretedRole}` : '',
    plan?.roleContext?.seniorityBand ? `Seniority band: ${plan.roleContext.seniorityBand}` : '',
    plan?.roleContext?.workContext ? `Work context: ${plan.roleContext.workContext}` : '',
  ].filter(Boolean).join('\n')));

  lines.push(asTextBlock('Market Reality', [
    plan?.marketReality?.directionalRange ? `Directional range: ${plan.marketReality.directionalRange}` : '',
    plan?.marketReality?.marketTension ? `Market tension: ${plan.marketReality.marketTension}` : '',
    plan?.marketReality?.confidenceLevel ? `Confidence: ${plan.marketReality.confidenceLevel}` : '',
  ].filter(Boolean).join('\n')));

  lines.push(asBullets('Assumption Check — What aligns', plan?.assumptionCheck?.whatAligns));
  lines.push(asBullets('Assumption Check — Potential misalignments', plan?.assumptionCheck?.potentialMisalignments));
  lines.push(asBullets('Assumption Check — Unknowns', plan?.assumptionCheck?.unknowns));

  lines.push(asBullets('Value Justification — Core leverage', plan?.valueJustification?.coreLeverage));
  lines.push(asBullets('Value Justification — Non-salary levers', plan?.valueJustification?.nonSalaryLevers));

  if (Array.isArray(plan?.negotiationPaths) && plan.negotiationPaths.length) {
    lines.push('Negotiation Paths');
    plan.negotiationPaths.slice(0, 3).forEach((p) => {
      lines.push(`- ${p?.label || 'Path'}`);
      if (p?.askFraming) lines.push(`  Ask framing: ${p.askFraming}`);
      if (p?.bestWhen) lines.push(`  Best when: ${p.bestWhen}`);
      if (p?.tradeoffs) lines.push(`  Tradeoffs: ${p.tradeoffs}`);
      lines.push('');
    });
  }

  if (plan?.conversationScript?.emailVersion) {
    lines.push('Conversation Script — Email');
    lines.push(plan.conversationScript.emailVersion);
    lines.push('');
  }
  if (plan?.conversationScript?.liveConversationVersion) {
    lines.push('Conversation Script — Live Conversation');
    lines.push(plan.conversationScript.liveConversationVersion);
    lines.push('');
  }

  lines.push(asBullets('Next Steps — Immediate', plan?.nextSteps?.immediate));
  lines.push(asBullets('Next Steps — Prepare for pushback', plan?.nextSteps?.prepareForPushback));
  lines.push(asBullets('Next Steps — Walk-away signals', plan?.nextSteps?.walkAwaySignals));

  if (plan?.mentorEscalation?.whyItHelps) {
    lines.push('Mentor Escalation');
    lines.push(plan.mentorEscalation.whyItHelps);
    if (plan?.mentorEscalation?.whatToBring) {
      lines.push('');
      lines.push('What to bring');
      lines.push(plan.mentorEscalation.whatToBring);
    }
    if (plan?.mentorEscalation?.spotlightCTA) {
      lines.push('');
      lines.push(plan.mentorEscalation.spotlightCTA);
    }
    lines.push('');
  }

  return lines
    .filter((x) => typeof x === 'string')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

export default function OfferNegotiationResultsComponent({ formData }) {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');

  const payload = useMemo(() => ({ formData }), [formData]);

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      setError('');
      setPlan(null);

      try {
        const resp = await fetch('/api/offer-negotiation/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(json?.error || 'Failed to generate plan');

        if (active) {
          setPlan(json?.plan || null);
        }
      } catch (e) {
        if (active) setError(String(e?.message || 'Error generating plan'));
      } finally {
        if (active) setLoading(false);
      }
    }

    if (formData) run();
    else {
      setLoading(false);
      setPlan(null);
      setError('Missing form data.');
    }

    return () => {
      active = false;
    };
  }, [payload, formData]);

  const downloadPdf = () => {
    const doc = new jsPDF({
      unit: 'pt',
      format: 'letter',
    });

    const text = buildPdfText(plan, formData);

    const margin = 40;
    const maxWidth = 520; // approx for letter with margins
    const lines = doc.splitTextToSize(text, maxWidth);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    let y = margin;
    lines.forEach((line) => {
      if (y > 760) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 14;
    });

    doc.save('ForgeTomorrow-Negotiation-Guidance.pdf');
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow space-y-3">
        <h2 className="text-xl font-semibold">Generating your strategy…</h2>
        <p className="text-gray-600">
          We’re pressure-testing assumptions and building a negotiation plan.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow space-y-3">
        <h2 className="text-xl font-semibold text-red-600">Couldn’t generate results</h2>
        <p className="text-gray-700">{error}</p>
        <p className="text-gray-500 text-sm">
          Try going back to the form and resubmitting.
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="bg-white p-6 rounded-lg shadow space-y-3">
        <h2 className="text-xl font-semibold">No plan returned</h2>
        <p className="text-gray-600">Please resubmit your form.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      {/* Disclaimers */}
      <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
        <p className="text-sm text-orange-900 font-semibold">
          {plan?.disclaimer?.summary ||
            'Guidance only — not legal, financial, or tax advice. Outcomes are not guaranteed.'}
        </p>
        <p className="text-sm text-orange-900 mt-2">
          {plan?.disclaimer?.mentorNote ||
            'Use this as a starting point and consult a coach/mentor for real-world strategy and accountability.'}
        </p>
      </div>

      {/* Role + market */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Role context</h2>
        <p className="text-gray-700">
          <span className="font-semibold">Interpreted role:</span> {plan?.roleContext?.interpretedRole || '—'}
          <br />
          <span className="font-semibold">Seniority band:</span> {plan?.roleContext?.seniorityBand || '—'}
          <br />
          <span className="font-semibold">Work context:</span> {plan?.roleContext?.workContext || '—'}
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Market reality (directional)</h2>
        <p className="text-gray-700">
          <span className="font-semibold">Directional range:</span> {plan?.marketReality?.directionalRange || '—'}
          <br />
          <span className="font-semibold">Market tension:</span> {plan?.marketReality?.marketTension || '—'}
          <br />
          <span className="font-semibold">Confidence:</span> {plan?.marketReality?.confidenceLevel || '—'}
        </p>
      </div>

      {/* Assumptions */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Assumption check</h2>

        <div>
          <h3 className="font-semibold text-gray-900">What aligns</h3>
          <ul className="list-disc list-inside text-gray-700">
            {safeArr(plan?.assumptionCheck?.whatAligns).map((x, i) => (
              <li key={`a-${i}`}>{x}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900">Potential misalignments</h3>
          <ul className="list-disc list-inside text-gray-700">
            {safeArr(plan?.assumptionCheck?.potentialMisalignments).map((x, i) => (
              <li key={`m-${i}`}>{x}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900">Unknowns to clarify</h3>
          <ul className="list-disc list-inside text-gray-700">
            {safeArr(plan?.assumptionCheck?.unknowns).map((x, i) => (
              <li key={`u-${i}`}>{x}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Value */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Value justification</h2>

        <div>
          <h3 className="font-semibold text-gray-900">Core leverage</h3>
          <ul className="list-disc list-inside text-gray-700">
            {safeArr(plan?.valueJustification?.coreLeverage).map((x, i) => (
              <li key={`cl-${i}`}>{x}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900">Non-salary levers</h3>
          <ul className="list-disc list-inside text-gray-700">
            {safeArr(plan?.valueJustification?.nonSalaryLevers).map((x, i) => (
              <li key={`nl-${i}`}>{x}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Paths */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Negotiation paths</h2>

        <div className="grid md:grid-cols-3 gap-4">
          {safeArr(plan?.negotiationPaths).slice(0, 3).map((p, i) => (
            <div key={`p-${i}`} className="border border-gray-200 rounded-lg p-4">
              <div
                className="inline-block px-3 py-1 rounded-full text-white text-sm font-semibold"
                style={{ background: ORANGE }}
              >
                {p?.label || `Path ${i + 1}`}
              </div>

              <p className="text-gray-800 mt-3">
                <span className="font-semibold">Ask framing:</span> {p?.askFraming || '—'}
              </p>
              <p className="text-gray-700 mt-2">
                <span className="font-semibold">Best when:</span> {p?.bestWhen || '—'}
              </p>
              <p className="text-gray-700 mt-2">
                <span className="font-semibold">Tradeoffs:</span> {p?.tradeoffs || '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Scripts */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Conversation scripts</h2>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold">Email version</h3>
          <p className="text-gray-700 whitespace-pre-line mt-2">
            {plan?.conversationScript?.emailVersion || '—'}
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold">Live conversation version</h3>
          <p className="text-gray-700 whitespace-pre-line mt-2">
            {plan?.conversationScript?.liveConversationVersion || '—'}
          </p>
        </div>
      </div>

      {/* Next steps */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Next steps</h2>

        <div>
          <h3 className="font-semibold text-gray-900">Immediate</h3>
          <ul className="list-disc list-inside text-gray-700">
            {safeArr(plan?.nextSteps?.immediate).map((x, i) => (
              <li key={`ni-${i}`}>{x}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900">Prepare for pushback</h3>
          <ul className="list-disc list-inside text-gray-700">
            {safeArr(plan?.nextSteps?.prepareForPushback).map((x, i) => (
              <li key={`np-${i}`}>{x}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900">Walk-away signals</h3>
          <ul className="list-disc list-inside text-gray-700">
            {safeArr(plan?.nextSteps?.walkAwaySignals).map((x, i) => (
              <li key={`nw-${i}`}>{x}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mentor CTA */}
      <div className="border border-gray-200 rounded-lg p-4 bg-slate-50">
        <h2 className="text-lg font-semibold">Bring a human mentor in</h2>
        <p className="text-gray-700 mt-2">
          {plan?.mentorEscalation?.whyItHelps ||
            'A coach can spot leverage, sharpen phrasing, and help you stay firm without burning goodwill.'}
        </p>
        <p className="text-gray-700 mt-2">
          <span className="font-semibold">What to bring:</span>{' '}
          {plan?.mentorEscalation?.whatToBring ||
            'This report, the offer details, job description, and your must-haves / walk-away points.'}
        </p>
        <a
          href="/hearth/spotlights"
          className="inline-block mt-3 font-bold"
          style={{ color: ORANGE }}
        >
          {plan?.mentorEscalation?.spotlightCTA ||
            'Go to Spotlight → Find a coach/mentor for incentive negotiation'}
        </a>
      </div>

      {/* Downloads */}
      <div className="flex justify-end space-x-4 mt-8">
        <button
          onClick={downloadPdf}
          className="bg-[#FF7043] text-white px-4 py-2 rounded hover:bg-[#F4511E] transition"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
