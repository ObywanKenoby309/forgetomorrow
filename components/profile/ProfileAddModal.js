// components/profile/ProfileAddModal.js
import React, { useEffect, useState } from 'react';

export default function ProfileAddModal({
  open = false,
  onClose,
  onSave,                 // (section, payload) => void
  initialFocus = '',      // '', 'experience','education','skills','projects','certifications','languages','volunteer','custom'
}) {
  const tabs = ['experience','education','skills','projects','certifications','languages','volunteer','custom'];
  const [active, setActive] = useState(tabs.includes(initialFocus) ? initialFocus : 'experience');

  useEffect(() => {
    if (initialFocus && tabs.includes(initialFocus)) setActive(initialFocus);
  }, [initialFocus]);

  // Simple form states
  const [exp, setExp] = useState({ title: '', company: '', startDate: '', endDate: '', description: '' });
  const [edu, setEdu] = useState({ school: '', degree: '', startDate: '', endDate: '' });
  const [skillsCSV, setSkillsCSV] = useState('');
  const [langsCSV, setLangsCSV] = useState('');
  const [project, setProject] = useState({ title: '', org: '', link: '', startDate: '', endDate: '', description: '' });
  const [cert, setCert] = useState({ name: '', issuer: '', issueDate: '', expireDate: '', credentialId: '' });
  const [vol, setVol] = useState({ role: '', org: '', startDate: '', endDate: '', description: '' });

  // Custom section
  const [customName, setCustomName] = useState('');
  const [customItem, setCustomItem] = useState({ title: '', date: '', description: '' });

  if (!open) return null;

  const save = () => {
    switch (active) {
      case 'experience':
        if (!exp.title.trim() || !exp.company.trim()) return alert('Please provide a title and company.');
        onSave?.('experience', exp);
        break;
      case 'education':
        if (!edu.school.trim()) return alert('Please provide a school.');
        onSave?.('education', edu);
        break;
      case 'skills': {
        const list = splitCSV(skillsCSV);
        if (!list.length) return alert('Enter at least one skill.');
        onSave?.('skills', list);
        break;
      }
      case 'languages': {
        const list = splitCSV(langsCSV);
        if (!list.length) return alert('Enter at least one language.');
        onSave?.('languages', list);
        break;
      }
      case 'projects':
        if (!project.title.trim()) return alert('Please provide a project title.');
        onSave?.('projects', project);
        break;
      case 'certifications':
        if (!cert.name.trim()) return alert('Please provide a certification name.');
        onSave?.('certifications', cert);
        break;
      case 'volunteer':
        if (!vol.role.trim() || !vol.org.trim()) return alert('Please provide role and organization.');
        onSave?.('volunteer', vol);
        break;
      case 'custom': {
        const name = customName.trim();
        if (!name) return alert('Give your section a name (e.g., Publications).');
        if (!customItem.title.trim() && !customItem.description.trim()) {
          return alert('Add at least a title or description.');
        }
        onSave?.('custom', { sectionName: name, item: customItem });
        break;
      }
      default: break;
    }
  };

  const titles = {
    experience: 'Add Experience',
    education: 'Add Education',
    skills: 'Add Skills',
    projects: 'Add Project',
    certifications: 'Add Certification',
    languages: 'Add Languages',
    volunteer: 'Add Volunteer Experience',
    custom: 'Add Custom Section',
  };
  const modalTitle = titles[active] || 'Add Profile Section';

  const TabBtn = ({ id, children }) => (
    <button
      type="button"
      onClick={() => setActive(id)}
      style={{
        background: active === id ? '#FF7043' : 'white',
        color: active === id ? 'white' : '#FF7043',
        border: '1px solid #FF7043',
        borderRadius: 999,
        padding: '6px 10px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        display: 'grid', placeItems: 'center', zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 720, background: 'white', borderRadius: 12,
          padding: 16, border: '1px solid #eee', boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
          display: 'grid', gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, color: '#263238' }}>{modalTitle}</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'white', color: '#FF7043', border: '1px solid #FF7043',
              borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TabBtn id="experience">Experience</TabBtn>
          <TabBtn id="education">Education</TabBtn>
          <TabBtn id="skills">Skills</TabBtn>
          <TabBtn id="projects">Projects</TabBtn>
          <TabBtn id="certifications">Certifications</TabBtn>
          <TabBtn id="languages">Languages</TabBtn>
          <TabBtn id="volunteer">Volunteer</TabBtn>
          <TabBtn id="custom">Custom</TabBtn>
        </div>

        {/* Forms ... (UNCHANGED BELOW) */}
        {active === 'experience' && (
          <Grid gap={10}>
            <Field label="Title"><input value={exp.title} onChange={(e) => setExp({ ...exp, title: e.target.value })} style={input} /></Field>
            <Field label="Company"><input value={exp.company} onChange={(e) => setExp({ ...exp, company: e.target.value })} style={input} /></Field>
            <Row>
              <Field label="Start date"><input type="month" value={exp.startDate} onChange={(e) => setExp({ ...exp, startDate: e.target.value })} style={input} /></Field>
              <Field label="End date (or empty for Present)"><input type="month" value={exp.endDate} onChange={(e) => setExp({ ...exp, endDate: e.target.value })} style={input} /></Field>
            </Row>
            <Field label="Description"><textarea rows={4} value={exp.description} onChange={(e) => setExp({ ...exp, description: e.target.value })} style={{ ...input, resize: 'vertical' }} /></Field>
          </Grid>
        )}

        {active === 'education' && (
          <Grid gap={10}>
            <Field label="School"><input value={edu.school} onChange={(e) => setEdu({ ...edu, school: e.target.value })} style={input} /></Field>
            <Field label="Degree / Program"><input value={edu.degree} onChange={(e) => setEdu({ ...edu, degree: e.target.value })} style={input} /></Field>
            <Row>
              <Field label="Start date"><input type="month" value={edu.startDate} onChange={(e) => setEdu({ ...edu, startDate: e.target.value })} style={input} /></Field>
              <Field label="End date"><input type="month" value={edu.endDate} onChange={(e) => setEdu({ ...edu, endDate: e.target.value })} style={input} /></Field>
            </Row>
          </Grid>
        )}

        {active === 'skills' && (
          <Grid gap={10}>
            <Field label="Skills (comma-separated)">
              <input placeholder="Leadership, SQL, Customer Success, …" value={skillsCSV} onChange={(e) => setSkillsCSV(e.target.value)} style={input} />
            </Field>
          </Grid>
        )}

        {active === 'projects' && (
          <Grid gap={10}>
            <Field label="Project title"><input value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} style={input} /></Field>
            <Field label="Organization / Team (optional)"><input value={project.org} onChange={(e) => setProject({ ...project, org: e.target.value })} style={input} /></Field>
            <Field label="Link (optional)"><input value={project.link} onChange={(e) => setProject({ ...project, link: e.target.value })} style={input} /></Field>
            <Row>
              <Field label="Start date"><input type="month" value={project.startDate} onChange={(e) => setProject({ ...project, startDate: e.target.value })} style={input} /></Field>
              <Field label="End date"><input type="month" value={project.endDate} onChange={(e) => setProject({ ...project, endDate: e.target.value })} style={input} /></Field>
            </Row>
            <Field label="Description"><textarea rows={4} value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} style={{ ...input, resize: 'vertical' }} /></Field>
          </Grid>
        )}

        {active === 'certifications' && (
          <Grid gap={10}>
            <Field label="Certification"><input value={cert.name} onChange={(e) => setCert({ ...cert, name: e.target.value })} style={input} /></Field>
            <Field label="Issuer"><input value={cert.issuer} onChange={(e) => setCert({ ...cert, issuer: e.target.value })} style={input} /></Field>
            <Row>
              <Field label="Issue date"><input type="month" value={cert.issueDate} onChange={(e) => setCert({ ...cert, issueDate: e.target.value })} style={input} /></Field>
              <Field label="Expiry (optional)"><input type="month" value={cert.expireDate} onChange={(e) => setCert({ ...cert, expireDate: e.target.value })} style={input} /></Field>
            </Row>
            <Field label="Credential ID (optional)"><input value={cert.credentialId} onChange={(e) => setCert({ ...cert, credentialId: e.target.value })} style={input} /></Field>
          </Grid>
        )}

        {active === 'languages' && (
          <Grid gap={10}>
            <Field label="Languages (comma-separated)">
              <input placeholder="English, Spanish, German, …" value={langsCSV} onChange={(e) => setLangsCSV(e.target.value)} style={input} />
            </Field>
          </Grid>
        )}

        {active === 'volunteer' && (
          <Grid gap={10}>
            <Field label="Role"><input value={vol.role} onChange={(e) => setVol({ ...vol, role: e.target.value })} style={input} /></Field>
            <Field label="Organization"><input value={vol.org} onChange={(e) => setVol({ ...vol, org: e.target.value })} style={input} /></Field>
            <Row>
              <Field label="Start date"><input type="month" value={vol.startDate} onChange={(e) => setVol({ ...vol, startDate: e.target.value })} style={input} /></Field>
              <Field label="End date"><input type="month" value={vol.endDate} onChange={(e) => setVol({ ...vol, endDate: e.target.value })} style={input} /></Field>
            </Row>
            <Field label="Description"><textarea rows={4} value={vol.description} onChange={(e) => setVol({ ...vol, description: e.target.value })} style={{ ...input, resize: 'vertical' }} /></Field>
          </Grid>
        )}

        {active === 'custom' && (
          <Grid gap={10}>
            <Field label="Section name (e.g., Publications, Awards)">
              <input value={customName} onChange={(e) => setCustomName(e.target.value)} style={input} />
            </Field>
            <Field label="Item title (e.g., Paper title / Award name)">
              <input value={customItem.title} onChange={(e) => setCustomItem({ ...customItem, title: e.target.value })} style={input} />
            </Field>
            <Field label="Date (optional)">
              <input type="month" value={customItem.date} onChange={(e) => setCustomItem({ ...customItem, date: e.target.value })} style={input} />
            </Field>
            <Field label="Description">
              <textarea rows={4} value={customItem.description} onChange={(e) => setCustomItem({ ...customItem, description: e.target.value })} style={{ ...input, resize: 'vertical' }} />
            </Field>
          </Grid>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'white', color: '#FF7043', border: '1px solid #FF7043',
              borderRadius: 10, padding: '10px 12px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            style={{
              background: '#FF7043', color: 'white', border: 'none',
              borderRadius: 10, padding: '10px 12px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- tiny helpers/components ---- */
const input = {
  border: '1px solid #ddd',
  borderRadius: 10,
  padding: '10px 12px',
  outline: 'none',
  background: 'white',
  width: '100%',
};

const splitCSV = (s = '') =>
  s.split(',').map(x => x.trim()).filter(Boolean);

function Field({ label, children }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, color: '#607D8B', fontWeight: 700 }}>{label}</span>
      {children}
    </label>
  );
}
function Grid({ gap = 10, children }) {
  return <div style={{ display: 'grid', gap }}>{children}</div>;
}
function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>;
}
