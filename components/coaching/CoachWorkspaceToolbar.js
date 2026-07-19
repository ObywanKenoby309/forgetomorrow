// components/coaching/CoachWorkspaceToolbar.js
import React from "react";

export default function CoachWorkspaceToolbar({
  activeWorkspace="dashboard",
  activeSubTab="overview",
  onWorkspaceChange,
  onSubTabChange,
}) {

const workspaces=[
["dashboard","Dashboard"],
["clients","Clients"],
["messaging","Messaging"],
["calendar","Calendar"],
["resources","Resources"],
["feedback","Feedback"],
["analytics","Analytics"],
];

const sub={
dashboard:[["dashboard","Coach Dashboard"]],
clients:[["overview","Overview"],["plan","Coaching Plan"],["strategy","Target Strategy"],["goals","Goals"],["homework","Homework"],["activity","Activity"],["notes","Notes"]],
messaging:[["coaching","Coaching Inbox"],["seeker","Seeker Inbox"]],
calendar:[["calendar","Calendar"],["sessions","Sessions"]],
resources:[["resources","Resources"],["vault","Vault"],["spotlights","Spotlights"]],
feedback:[["feedback","Client Feedback"]],
analytics:[["overview","Overview"],["progress","Client Progress"],["sessions","Session Trends"],["outcomes","Outcomes"],["reports","Reports"]],
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
