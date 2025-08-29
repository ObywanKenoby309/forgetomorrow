// components/resume/create/RightRail.js
export default function RightRail({
  data,
  onOpenAts,
  onOpenAnalyzer,
  onOpenTailor,
  onOpenPreview,
  coverStorageKey,
  SnapshotControls,
  AtsCheckBadge,
  ClientPDFButton,
  SmartExportMenu,
}) {
  const {
    formData, summary, experiences, projects, volunteerExperiences,
    educationList, certifications, languages, skills, achievements, customSections
  } = data || {};

  return (
    <aside style={{ display: 'grid', gap: 12, width: '100%' }}>
      {/* ATS status + Save + Export */}
      <div
        style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 12,
          padding: 12,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          display: 'grid',
          gap: 10,
        }}
      >
        {/* ATS row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AtsCheckBadge
            formData={formData}
            summary={summary}
            experiences={experiences}
            educationList={educationList}
            skills={skills}
          />
          <button
            type="button"
            onClick={onOpenAts}
            style={{
              background: 'white',
              border: '1px solid #E0E0E0',
              borderRadius: 10,
              padding: '6px 10px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            ATS Preview
          </button>
        </div>

        {/* Save snapshots / versions */}
        <SnapshotControls compact coverStorageKey={coverStorageKey} />

        {/* Export */}
        <div
          style={{
            background: '#FAFAFA',
            border: '1px dashed #CFD8DC',
            borderRadius: 10,
            padding: 10,
          }}
        >
          <div style={{ fontWeight: 700, color: '#37474F', marginBottom: 6, fontSize: 13 }}>
            Export / Download
          </div>

          <ClientPDFButton
            formData={formData}
            summary={summary}
            experiences={experiences}
            projects={projects}
            volunteerExperiences={volunteerExperiences}
            educationList={educationList}
            certifications={certifications}
            languages={languages}
            skills={skills}
            achievements={achievements}
            customSections={customSections}
            coverStorageKey={coverStorageKey}
            defaultCombined={true}
            defaultOrder="resume-first"
            defaultAtsMode={true}
            className="bg-[#FF7043] hover:bg-[#F4511E] text-white py-1.5 px-3 rounded text-sm w-full"
          />

          <div style={{ marginTop: 8 }}>
            <SmartExportMenu
              formData={formData}
              summary={summary}
              experiences={experiences}
              projects={projects}
              volunteerExperiences={volunteerExperiences}
              educationList={educationList}
              certifications={certifications}
              languages={languages}
              skills={skills}
              achievements={achievements}
              customSections={customSections}
              coverStorageKey={coverStorageKey}
            />
          </div>
        </div>
      </div>

      {/* Tools */}
      <div
        style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 12,
          padding: 12,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          display: 'grid',
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 700, color: '#263238', fontSize: 13, marginBottom: 2 }}>
          Tools
        </div>
        <ToolRow
          title="Job Match Analyzer"
          subtitle="Paste a JD and see matched/missing keywords plus a score."
          onClick={onOpenAnalyzer}
        />
        <ToolRow
          title="Tailor (Local)"
          subtitle="Generate summary & bullets aligned to the JD—no API."
          onClick={onOpenTailor}
        />
        <ToolRow
          title="Live Preview"
          subtitle="See your resume rendered as you edit."
          onClick={onOpenPreview}
        />
      </div>
    </aside>
  );
}

function ToolRow({ title, subtitle, onClick }) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 10,
        display: 'grid',
        alignItems: 'start',
        gap: 6,
      }}
    >
      <div style={{ fontWeight: 800, color: '#FF7043', fontSize: 13 }}>{title}</div>
      <div style={{ color: '#607D8B', fontSize: 12 }}>{subtitle}</div>
      <div>
        <button
          type="button"
          onClick={onClick}
          style={{
            background: 'white',
            color: '#263238',
            padding: '6px 10px',
            borderRadius: 10,
            border: '1px solid #E0E0E0',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Open
        </button>
      </div>
    </div>
  );
}
