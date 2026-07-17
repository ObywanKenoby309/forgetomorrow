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
clients:[["overview","Overview"],["plan","Coaching Plan"],["goals","Goals"],["homework","Homework"],["activity","Activity"],["notes","Notes"]],
messaging:[["coaching","Coaching Inbox"],["seeker","Seeker Inbox"]],
calendar:[["calendar","Calendar"],["sessions","Sessions"]],
resources:[["vault","Vault"],["resources","Resources"],["spotlights","Spotlights"]],
feedback:[["feedback","Client Feedback"]],
analytics:[["overview","Overview"],["progress","Client Progress"],["sessions","Session Trends"],["outcomes","Outcomes"],["reports","Reports"]],
};

return(
<div style={{
border:"1px solid rgba(255,255,255,.14)",
borderRadius:22,
padding:10,
background:"rgba(255,255,255,.18)",
backdropFilter:"blur(20px)",
WebkitBackdropFilter:"blur(20px)",
boxShadow:"0 18px 45px rgba(0,0,0,.18)"
}}>

<div style={{
display:"grid",
gridTemplateColumns:"repeat(7,minmax(0,1fr))",
gap:8
}}>
{workspaces.map(([k,l])=>(
<button
key={k}
onClick={()=>onWorkspaceChange?.(k)}
style={{
padding:"9px 10px",
borderRadius:12,
fontSize:13,
fontWeight:700,
border:activeWorkspace===k?"1px solid rgba(255,112,67,.55)":"1px solid rgba(255,255,255,.12)",
background:activeWorkspace===k?"rgba(255,112,67,.18)":"rgba(255,255,255,.08)",
color:"#fff",
backdropFilter:"blur(12px)",
transition:"all .18s ease",
cursor:"pointer"
}}
>{l}</button>
))}
</div>

<div style={{
display:"grid",
gridTemplateColumns:`repeat(${Math.max((sub[activeWorkspace]||[]).length,1)},minmax(0,1fr))`,
gap:8,
marginTop:12
}}>
{(sub[activeWorkspace]||[]).map(([k,l])=>(
<button
key={k}
onClick={()=>onSubTabChange?.(k)}
style={{
padding:"8px 8px",
borderRadius:999,
fontSize:12,
fontWeight:600,
border:activeSubTab===k?"1px solid rgba(255,112,67,.55)":"1px solid rgba(255,255,255,.10)",
background:activeSubTab===k?"rgba(255,112,67,.22)":"rgba(255,255,255,.05)",
color:"#fff",
cursor:"pointer",
whiteSpace:"nowrap"
}}
>{l}</button>
))}
</div>

</div>
);
}
