// components/recruiter/RecruiterWorkspaceToolbar.js
import React from "react";

export default function RecruiterWorkspaceToolbar({
  activeWorkspace="dashboard",
  activeSubTab="overview",
  onWorkspaceChange,
  onSubTabChange,
}) {

const workspaces=[
["dashboard","Dashboard"],
["candidates","Candidates"],
["jobs","Jobs"],
["messaging","Messaging"],
["calendar","Calendar"],
["resources","Resources"],
["feedback","Feedback"],
["analytics","Analytics"],
];

const sub={
dashboard:[["dashboard","Recruiter Dashboard"]],
candidates:[["selection","Candidate Selection"],["pools","Talent Pools"],["search","Internal Candidate Search"]],
jobs:[["jobs","Job Postings"]],
messaging:[["recruiter","Recruiter Inbox"],["seeker","Seeker Inbox"],["foundry","Foundries"]],
calendar:[["calendar","Calendar"]],
resources:[["resources","Resources"],["compare","External Compare"],["vault","Vault"]],
feedback:[["feedback","Feedback"]],
analytics:[["overview","Executive Overview"],["details","Report Details"],["presentation","Presentation Visuals"],["snapshot","Snapshot Delivery"]],
};

const topStyle=(active)=>({
padding:"8px 8px",
border:"none",
borderBottom:active?"3px solid #FF7043":"3px solid transparent",
background:"transparent",
color:"#fff",
fontSize:14,
fontWeight:700,
cursor:"pointer",
transition:"all .18s ease",
textShadow:"0 1px 2px rgba(0,0,0,.45)"
});

const subStyle=(active)=>({
padding:"6px 8px",
border:"none",
borderBottom:active?"2px solid #FF7043":"2px solid transparent",
background:"transparent",
color:active?"#fff":"rgba(255,255,255,.88)",
fontSize:12,
fontWeight:600,
cursor:"pointer",
transition:"all .18s ease",
textShadow:"0 1px 2px rgba(0,0,0,.45)"
});

return (
<div style={{
maxWidth:1520,
margin:"0 auto",
border:"1px solid rgba(255,255,255,.10)",
borderRadius:20,
padding:"10px 18px 12px",
background:"rgba(255,255,255,.05)",
backdropFilter:"blur(14px)",
WebkitBackdropFilter:"blur(14px)",
boxShadow:"0 8px 24px rgba(0,0,0,.10)"
}}>
<div style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
gap:12,
borderBottom:"1px solid rgba(255,255,255,.08)",
paddingBottom:8
}}>
{workspaces.map(([k,l])=>(
<button key={k} onClick={()=>onWorkspaceChange?.(k)} style={topStyle(activeWorkspace===k)}>{l}</button>
))}
</div>

<div style={{
display:"flex",
justifyContent:"center",
alignItems:"center",
gap:36,
paddingTop:8,
flexWrap:"wrap",
width:"100%"
}}>
{(sub[activeWorkspace]||[]).map(([k,l])=>(
<button key={k} onClick={()=>onSubTabChange?.(k)} style={subStyle(activeSubTab===k)}>{l}</button>
))}
</div>
</div>
);
}
