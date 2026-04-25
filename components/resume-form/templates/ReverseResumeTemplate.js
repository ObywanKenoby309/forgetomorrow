// components/resume-form/templates/ReverseResumeTemplate.js
// Supports isEditMode + onUpdate for inline editing from the resume builder
import { useState } from 'react';

const ORANGE = '#FF7043';

function EditableText({ value, onChange, placeholder, multiline, style, isEditMode }) {
  if (!isEditMode) {
    return <span style={style}>{value || <span style={{ color: '#ccc' }}>{placeholder}</span>}</span>;
  }
  if (multiline) {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          width: '100%', border: `1.5px solid ${ORANGE}`, borderRadius: 6,
          padding: '6px 8px', fontSize: 'inherit', fontFamily: 'inherit',
          lineHeight: 'inherit', color: 'inherit', background: 'rgba(255,112,67,0.04)',
          resize: 'vertical', outline: 'none', boxSizing: 'border-box', ...style,
        }}
      />
    );
  }
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        border: `1.5px solid ${ORANGE}`, borderRadius: 6, padding: '4px 8px',
        fontSize: 'inherit', fontFamily: 'inherit', color: 'inherit',
        background: 'rgba(255,112,67,0.04)', outline: 'none', width: '100%',
        boxSizing: 'border-box', ...style,
      }}
    />
  );
}

function SectionWrapper({ isEditMode, label, children, onAdd, addLabel }) {
  return (
    <div style={{ marginBottom: '16pt', position: 'relative' }}>
      {isEditMode && (
        <div style={{
          position: 'absolute', top: 0, right: 0, fontSize: 10,
          color: ORANGE, fontWeight: 700, background: 'rgba(255,112,67,0.08)',
          border: `1px solid rgba(255,112,67,0.25)`, borderRadius: 4,
          padding: '2px 7px', userSelect: 'none',
        }}>✏️ {label}</div>
      )}
      {children}
      {isEditMode && onAdd && (
        <button type="button" onClick={onAdd} style={{
          marginTop: 8, background: 'rgba(255,112,67,0.10)',
          border: `1px solid rgba(255,112,67,0.30)`, color: ORANGE,
          borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
        }}>+ {addLabel || 'Add'}</button>
      )}
    </div>
  );
}

const H2 = {
  fontSize: '13pt', fontWeight: 'bold', margin: '0 0 6pt 0',
  borderBottom: '1pt solid #000', textTransform: 'uppercase',
};

const editBox = {
  border: '1px solid rgba(255,112,67,0.15)', borderRadius: 8,
  padding: '10px', background: 'rgba(255,112,67,0.02)',
};

export default function ReverseResumeTemplate({ data, isEditMode = false, onUpdate }) {
  const {
    personalInfo = {}, summary = '', workExperiences = [], projects = [],
    educationList = [], skills = [], languages = [], certifications = [], customSections = [],
  } = data;

  const update = (field, value) => { if (onUpdate) onUpdate(field, value); };
  const updatePI = (key, value) => update('personalInfo', { ...personalInfo, [key]: value });

  const contactLine = [personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(' | ');

  return (
    <div style={{ width: '100%', padding: 0, margin: 0, fontFamily: 'Georgia, serif', fontSize: '11pt', lineHeight: '1.4', color: '#1f2937' }}>

      {/* HEADER / CONTACT */}
      <SectionWrapper isEditMode={isEditMode} label="Contact Info">
        <div style={{ textAlign: isEditMode ? 'left' : 'center', marginBottom: '16pt', paddingTop: isEditMode ? 28 : 0 }}>
          {isEditMode ? (
            <div style={{ display: 'grid', gap: 6 }}>
              <EditableText isEditMode value={personalInfo.name} onChange={(v) => updatePI('name', v)} placeholder="Full Name" style={{ fontSize: '16pt', fontWeight: 'bold' }} />
              <EditableText isEditMode value={personalInfo.targetedRole} onChange={(v) => updatePI('targetedRole', v)} placeholder="Targeted Role / Title" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <EditableText isEditMode value={personalInfo.email} onChange={(v) => updatePI('email', v)} placeholder="Email" />
                <EditableText isEditMode value={personalInfo.phone} onChange={(v) => updatePI('phone', v)} placeholder="Phone" />
                <EditableText isEditMode value={personalInfo.location} onChange={(v) => updatePI('location', v)} placeholder="Location" />
                <EditableText isEditMode value={personalInfo.portfolio} onChange={(v) => updatePI('portfolio', v)} placeholder="Portfolio URL" />
              </div>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '28pt', fontWeight: 'bold', margin: 0 }}>{personalInfo.name}</h1>
              {personalInfo.targetedRole && <p style={{ fontSize: '12pt', fontStyle: 'italic', margin: '6pt 0 0 0', color: '#444' }}>{personalInfo.targetedRole}</p>}
              {contactLine && <p style={{ fontSize: '11pt', margin: '4pt 0 0 0', color: '#666' }}>{contactLine}</p>}
              {personalInfo.portfolio && <p style={{ fontSize: '11pt', margin: '2pt 0 0 0', color: '#666' }}>{personalInfo.portfolio}</p>}
              {personalInfo.ftProfile && <p style={{ fontSize: '11pt', margin: '2pt 0 0 0', color: '#666' }}>{personalInfo.ftProfile}</p>}
            </>
          )}
        </div>
      </SectionWrapper>

      {/* SUMMARY */}
      <SectionWrapper isEditMode={isEditMode} label="Summary">
        {(summary || isEditMode) && (
          <div style={{ marginBottom: '16pt' }}>
            <h2 style={H2}>Professional Summary</h2>
            <EditableText isEditMode={isEditMode} value={summary} onChange={(v) => update('summary', v)}
              placeholder="Write a compelling professional summary..." multiline style={{ margin: 0, fontSize: '11pt' }} />
          </div>
        )}
      </SectionWrapper>

      {/* EXPERIENCE */}
      <SectionWrapper isEditMode={isEditMode} label="Experience"
        onAdd={() => update('workExperiences', [...workExperiences, { title: '', company: '', location: '', startDate: '', endDate: '', bullets: [''] }])}
        addLabel="Add Experience">
        {workExperiences.length > 0 && (
          <div style={{ marginBottom: '16pt' }}>
            <h2 style={H2}>Experience</h2>
            {workExperiences.map((exp, i) => (
              <div key={i} style={{ marginBottom: '12pt', ...(isEditMode ? editBox : {}) }}>
                {isEditMode ? (
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <EditableText isEditMode value={exp.title} onChange={(v) => { const u=[...workExperiences]; u[i]={...exp,title:v}; update('workExperiences',u); }} placeholder="Job Title" style={{ fontWeight: 'bold' }} />
                      <EditableText isEditMode value={exp.company} onChange={(v) => { const u=[...workExperiences]; u[i]={...exp,company:v}; update('workExperiences',u); }} placeholder="Company" />
                      <EditableText isEditMode value={exp.location} onChange={(v) => { const u=[...workExperiences]; u[i]={...exp,location:v}; update('workExperiences',u); }} placeholder="Location" />
                      <div style={{ display: 'flex', gap: 4 }}>
                        <EditableText isEditMode value={exp.startDate} onChange={(v) => { const u=[...workExperiences]; u[i]={...exp,startDate:v}; update('workExperiences',u); }} placeholder="Start" />
                        <span style={{ padding: '4px 2px' }}>–</span>
                        <EditableText isEditMode value={exp.endDate} onChange={(v) => { const u=[...workExperiences]; u[i]={...exp,endDate:v}; update('workExperiences',u); }} placeholder="End / Present" />
                      </div>
                    </div>
                    <div>
                      {(exp.bullets || ['']).map((b, bi) => (
                        <div key={bi} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                          <span style={{ color: '#94A3B8', paddingTop: 6, flexShrink: 0 }}>•</span>
                          <EditableText isEditMode value={b} onChange={(v) => { const u=[...workExperiences]; const bl=[...(exp.bullets||[])]; bl[bi]=v; u[i]={...exp,bullets:bl}; update('workExperiences',u); }} placeholder="Achievement or responsibility..." multiline style={{ fontSize: '10pt' }} />
                          <button type="button" onClick={() => { const u=[...workExperiences]; u[i]={...exp,bullets:(exp.bullets||[]).filter((_,x)=>x!==bi)}; update('workExperiences',u); }} style={{ color:'#EF4444',background:'none',border:'none',cursor:'pointer',flexShrink:0,fontSize:16,lineHeight:1 }}>×</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => { const u=[...workExperiences]; u[i]={...exp,bullets:[...(exp.bullets||[]),'']}; update('workExperiences',u); }} style={{ fontSize:11,color:ORANGE,background:'none',border:'none',cursor:'pointer',fontWeight:700 }}>+ Add bullet</button>
                    </div>
                    <button type="button" onClick={() => update('workExperiences',workExperiences.filter((_,x)=>x!==i))} style={{ alignSelf:'flex-start',fontSize:11,color:'#EF4444',background:'none',border:'none',cursor:'pointer',fontWeight:700 }}>Remove Experience</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                      <div>
                        <strong style={{ fontSize:'11pt' }}>{exp.title||exp.jobTitle}</strong>
                        <span style={{ color:'#444',marginLeft:'8pt' }}>{exp.company}{exp.location&&` • ${exp.location}`}</span>
                      </div>
                      <span style={{ fontSize:'10pt',color:'#666',whiteSpace:'nowrap' }}>{exp.startDate} – {exp.endDate||'Present'}</span>
                    </div>
                    {(exp.bullets||[]).map((b,bi)=><p key={bi} style={{ margin:'3pt 0 3pt 16pt' }}>{b}</p>)}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionWrapper>

      {/* PROJECTS */}
      <SectionWrapper isEditMode={isEditMode} label="Projects"
        onAdd={() => update('projects',[...projects,{title:'',company:'',startDate:'',endDate:'',bullets:['']}])}
        addLabel="Add Project">
        {projects.length > 0 && (
          <div style={{ marginBottom:'16pt' }}>
            <h2 style={H2}>Projects</h2>
            {projects.map((proj,i)=>(
              <div key={i} style={{ marginBottom:'12pt',...(isEditMode?editBox:{}) }}>
                {isEditMode ? (
                  <div style={{ display:'grid',gap:6 }}>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
                      <EditableText isEditMode value={proj.title} onChange={(v)=>{ const u=[...projects]; u[i]={...proj,title:v}; update('projects',u); }} placeholder="Project Title" style={{ fontWeight:'bold' }} />
                      <EditableText isEditMode value={proj.company} onChange={(v)=>{ const u=[...projects]; u[i]={...proj,company:v}; update('projects',u); }} placeholder="Company / Client" />
                      <EditableText isEditMode value={proj.startDate} onChange={(v)=>{ const u=[...projects]; u[i]={...proj,startDate:v}; update('projects',u); }} placeholder="Start Date" />
                      <EditableText isEditMode value={proj.endDate} onChange={(v)=>{ const u=[...projects]; u[i]={...proj,endDate:v}; update('projects',u); }} placeholder="End Date" />
                    </div>
                    {(proj.bullets||['']).map((b,bi)=>(
                      <div key={bi} style={{ display:'flex',gap:6,marginBottom:4 }}>
                        <span style={{ color:'#94A3B8',paddingTop:6,flexShrink:0 }}>•</span>
                        <EditableText isEditMode value={b} onChange={(v)=>{ const u=[...projects]; const bl=[...(proj.bullets||[])]; bl[bi]=v; u[i]={...proj,bullets:bl}; update('projects',u); }} placeholder="Project detail..." multiline style={{ fontSize:'10pt' }} />
                        <button type="button" onClick={()=>{ const u=[...projects]; u[i]={...proj,bullets:(proj.bullets||[]).filter((_,x)=>x!==bi)}; update('projects',u); }} style={{ color:'#EF4444',background:'none',border:'none',cursor:'pointer',fontSize:16 }}>×</button>
                      </div>
                    ))}
                    <button type="button" onClick={()=>{ const u=[...projects]; u[i]={...proj,bullets:[...(proj.bullets||[]),'']}; update('projects',u); }} style={{ fontSize:11,color:ORANGE,background:'none',border:'none',cursor:'pointer',fontWeight:700 }}>+ Add bullet</button>
                    <button type="button" onClick={()=>update('projects',projects.filter((_,x)=>x!==i))} style={{ alignSelf:'flex-start',fontSize:11,color:'#EF4444',background:'none',border:'none',cursor:'pointer',fontWeight:700 }}>Remove Project</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display:'flex',justifyContent:'space-between' }}>
                      <div>
                        <strong>{proj.title||proj.name}</strong>
                        <span style={{ color:'#444',marginLeft:'8pt' }}>{proj.company||proj.org}</span>
                      </div>
                      {(proj.startDate||proj.endDate)&&<span style={{ fontSize:'10pt',color:'#666' }}>{proj.startDate} – {proj.endDate||'Present'}</span>}
                    </div>
                    {(proj.bullets||[]).map((b,bi)=><p key={bi} style={{ margin:'3pt 0 3pt 16pt' }}>{b}</p>)}
                    {proj.description&&(!proj.bullets||proj.bullets.length===0)&&<p style={{ margin:'3pt 0 3pt 16pt' }}>{proj.description}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionWrapper>

      {/* EDUCATION */}
      <SectionWrapper isEditMode={isEditMode} label="Education"
        onAdd={()=>update('educationList',[...educationList,{degree:'',field:'',school:'',institution:'',location:'',startDate:'',endDate:''}])}
        addLabel="Add Education">
        {(educationList.length>0||isEditMode)&&(
          <div style={{ marginBottom:'16pt' }}>
            <h2 style={H2}>Education</h2>
            {educationList.map((edu,i)=>(
              <div key={i} style={{ marginBottom:'10pt',...(isEditMode?editBox:{}) }}>
                {isEditMode ? (
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
                    <EditableText isEditMode value={edu.degree} onChange={(v)=>{ const u=[...educationList]; u[i]={...edu,degree:v}; update('educationList',u); }} placeholder="Degree" />
                    <EditableText isEditMode value={edu.field} onChange={(v)=>{ const u=[...educationList]; u[i]={...edu,field:v}; update('educationList',u); }} placeholder="Field of Study" />
                    <EditableText isEditMode value={edu.school||edu.institution} onChange={(v)=>{ const u=[...educationList]; u[i]={...edu,school:v,institution:v}; update('educationList',u); }} placeholder="School / University" />
                    <EditableText isEditMode value={edu.location} onChange={(v)=>{ const u=[...educationList]; u[i]={...edu,location:v}; update('educationList',u); }} placeholder="Location" />
                    <EditableText isEditMode value={edu.startDate} onChange={(v)=>{ const u=[...educationList]; u[i]={...edu,startDate:v}; update('educationList',u); }} placeholder="Start Year" />
                    <EditableText isEditMode value={edu.endDate} onChange={(v)=>{ const u=[...educationList]; u[i]={...edu,endDate:v}; update('educationList',u); }} placeholder="End Year" />
                    <button type="button" onClick={()=>update('educationList',educationList.filter((_,x)=>x!==i))} style={{ gridColumn:'1/-1',fontSize:11,color:'#EF4444',background:'none',border:'none',cursor:'pointer',fontWeight:700,textAlign:'left' }}>Remove</button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontWeight:'bold' }}>{edu.degree} {edu.field}</div>
                    <div style={{ fontSize:'10pt' }}>{edu.institution||edu.school}{edu.location&&` • ${edu.location}`}</div>
                    <div style={{ fontSize:'10pt',color:'#666' }}>{edu.startDate} – {edu.endDate||'Present'}</div>
                    {edu.description&&<div style={{ marginTop:'3pt',fontSize:'10pt' }}>{edu.description}</div>}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionWrapper>

      {/* CERTIFICATIONS */}
      <SectionWrapper isEditMode={isEditMode} label="Certifications"
        onAdd={()=>update('certifications',[...certifications,{name:'',issuer:'',date:''}])}
        addLabel="Add Certification">
        {certifications.length>0&&(
          <div style={{ marginBottom:'16pt' }}>
            <h2 style={H2}>Certifications &amp; Training</h2>
            {certifications.map((cert,i)=>(
              <div key={i} style={{ marginBottom:'8pt',...(isEditMode?editBox:{}) }}>
                {isEditMode ? (
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
                    <EditableText isEditMode value={cert.name||cert.title} onChange={(v)=>{ const u=[...certifications]; u[i]={...cert,name:v}; update('certifications',u); }} placeholder="Certification Name" />
                    <EditableText isEditMode value={cert.issuer||cert.organization} onChange={(v)=>{ const u=[...certifications]; u[i]={...cert,issuer:v}; update('certifications',u); }} placeholder="Issuer" />
                    <EditableText isEditMode value={cert.date} onChange={(v)=>{ const u=[...certifications]; u[i]={...cert,date:v}; update('certifications',u); }} placeholder="Date Earned" />
                    <button type="button" onClick={()=>update('certifications',certifications.filter((_,x)=>x!==i))} style={{ fontSize:11,color:'#EF4444',background:'none',border:'none',cursor:'pointer',fontWeight:700,textAlign:'left' }}>Remove</button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontWeight:'bold' }}>{cert.name||cert.title}</div>
                    <div style={{ fontSize:'10pt',color:'#444' }}>{cert.issuer||cert.organization}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionWrapper>

      {/* LANGUAGES */}
      <SectionWrapper isEditMode={isEditMode} label="Languages"
        onAdd={()=>update('languages',[...languages,''])} addLabel="Add Language">
        {languages.length>0&&(
          <div style={{ marginBottom:'16pt' }}>
            <h2 style={H2}>Languages</h2>
            {isEditMode ? (
              <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                {languages.map((lang,i)=>(
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:4 }}>
                    <input value={typeof lang==='string'?lang:lang.language||lang.label||''} onChange={(e)=>{ const u=[...languages]; u[i]=e.target.value; update('languages',u); }} style={{ border:`1px solid ${ORANGE}`,borderRadius:6,padding:'3px 8px',fontSize:11,outline:'none',width:120 }} />
                    <button type="button" onClick={()=>update('languages',languages.filter((_,x)=>x!==i))} style={{ color:'#EF4444',background:'none',border:'none',cursor:'pointer',fontSize:14 }}>×</button>
                  </div>
                ))}
              </div>
            ) : (
              <p>{languages.join(' • ')}</p>
            )}
          </div>
        )}
      </SectionWrapper>

      {/* SKILLS */}
      <SectionWrapper isEditMode={isEditMode} label="Skills"
        onAdd={()=>update('skills',[...skills,''])} addLabel="Add Skill">
        {skills.length>0&&(
          <div style={{ marginBottom:'16pt' }}>
            <h2 style={H2}>Skills</h2>
            {isEditMode ? (
              <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                {skills.map((skill,i)=>(
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:4,background:'rgba(255,112,67,0.08)',border:`1px solid rgba(255,112,67,0.25)`,borderRadius:20,padding:'2px 8px' }}>
                    <input value={skill} onChange={(e)=>{ const u=[...skills]; u[i]=e.target.value; update('skills',u); }} style={{ border:'none',background:'transparent',fontSize:11,outline:'none',width:Math.max(50,skill.length*7) }} />
                    <button type="button" onClick={()=>update('skills',skills.filter((_,x)=>x!==i))} style={{ color:'#EF4444',background:'none',border:'none',cursor:'pointer',fontSize:13,lineHeight:1,padding:0 }}>×</button>
                  </div>
                ))}
              </div>
            ) : (
              <p>{skills.join(' • ')}</p>
            )}
          </div>
        )}
      </SectionWrapper>

      {/* CUSTOM SECTIONS */}
      {customSections.length>0&&customSections.map((section,i)=>(
        <div key={i} style={{ marginBottom:'16pt' }}>
          <h2 style={H2}>{section.title||section.heading||'Additional Information'}</h2>
          {Array.isArray(section.items) ? (
            <ul style={{ margin:0,paddingLeft:'16pt' }}>
              {section.items.map((item,idx)=><li key={idx} style={{ marginBottom:'3pt' }}>{item}</li>)}
            </ul>
          ) : (section.content&&<p>{section.content}</p>)}
        </div>
      ))}
    </div>
  );
}