// pages/dashboard/coaching/coaching-workspace-mock.js
import React from "react";

export default function CoachingWorkspaceMock() {
  const clients = [
    { name: "Eric James", role: "Director of Customer Success", active: true },
    { name: "Sarah Johnson", role: "Marketing Director" },
    { name: "Mike Wilson", role: "Software Engineer" },
    { name: "Amanda Lee", role: "Operations Manager" },
  ];

  const tools = [
    "Resume ↔ Job Alignment",
    "Interview Preparation",
    "Career Strategy",
    "LinkedIn Review",
    "Skills Analysis",
    "Communication Review",
    "The Hammer",
    "ForgeVault",
  ];

  return (
    <div style={{display:"flex",height:"100vh",background:"#0f172a",color:"#fff",fontFamily:"Inter,sans-serif"}}>
      {/* Platform Rail */}
      <aside style={{width:72,background:"#111827",padding:12,borderRight:"1px solid #293241"}}>
        <div style={{fontWeight:700,marginBottom:20}}>FT</div>
        {["🏠","💬","📅","👥","📁","📊","⚙️"].map(i=>(
          <div key={i} style={{margin:"18px 0",fontSize:22,textAlign:"center"}}>{i}</div>
        ))}
      </aside>

      {/* Client Rail */}
      <aside style={{width:270,background:"#172033",padding:16,borderRight:"1px solid #293241"}}>
        <h3>Clients</h3>
        <input placeholder="Search..." style={{width:"100%",padding:8,borderRadius:6}}/>
        <div style={{marginTop:16}}>
          {clients.map(c=>(
            <div key={c.name} style={{
              padding:12,
              marginBottom:10,
              borderRadius:8,
              background:c.active?"#f4511e":"#1e293b"
            }}>
              <strong>{c.name}</strong><br/>
              <small>{c.role}</small>
            </div>
          ))}
        </div>
      </aside>

      {/* Workspace */}
      <main style={{flex:1,padding:24,overflow:"auto"}}>
        <h1>Eric James</h1>
        <div style={{opacity:.8}}>Director of Customer Success • Session #12 • Tomorrow 2:00 PM</div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginTop:24}}>
          <Card title="Forge Intelligence">
            {tools.map(t=><div key={t}>• {t}</div>)}
          </Card>

          <Card title="Coach Notes">
            <p>• Wants SaaS leadership role</p>
            <p>• Avoid relocation</p>
            <p>• Strong executive communication</p>
          </Card>

          <Card title="Interview Workspace">
            <p>Target Company: Microsoft</p>
            <p>Role: Customer Success Director</p>
            <button>Analyze Job</button>
          </Card>

          <Card title="Homework">
            <p>☑ Update LinkedIn headline</p>
            <p>☐ Prepare STAR stories</p>
            <p>☐ Practice salary discussion</p>
          </Card>

          <Card title="Timeline">
            <p>Yesterday - Resume Updated</p>
            <p>Monday - Session Complete</p>
            <p>Last Week - Applied to 3 jobs</p>
          </Card>

          <Card title="Shared Workspace">
            <p>Resume.docx</p>
            <p>CoverLetter.docx</p>
            <p>InterviewNotes.pdf</p>
          </Card>
        </div>
      </main>

      {/* Intelligence Rail */}
      <aside style={{width:300,background:"#172033",padding:16,borderLeft:"1px solid #293241"}}>
        <h3>Quick Snapshot</h3>
        <p>Resume Score: 84</p>
        <p>Profile: 91%</p>
        <p>Applications: 38</p>
        <p>Interviews: 6</p>

        <h3 style={{marginTop:24}}>Quick Actions</h3>
        {["Schedule Session","Message Client","Launch Hammer","Open Calendar","Upload Resource"].map(a=>(
          <button key={a} style={{display:"block",width:"100%",marginBottom:8,padding:10}}>{a}</button>
        ))}
      </aside>
    </div>
  );
}

function Card({title,children}){
  return (
    <div style={{background:"#1e293b",padding:18,borderRadius:10,minHeight:180}}>
      <h2 style={{marginTop:0,color:"#ff7043"}}>{title}</h2>
      {children}
    </div>
  );
}