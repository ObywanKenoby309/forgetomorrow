components/coaching/CoachWorkspaceToolbar.js
import React from "react";
// Minimal first-pass mock toolbar for Coach ecosystem.
// Replace with wiring later.

export default function CoachWorkspaceToolbar({
  activeWorkspace="clients",
  activeSubTab="overview",
  onWorkspaceChange,
  onSubTabChange,
}) {
  const workspaces=[
    ["clients","Clients"],
    ["messaging","Messaging"],
    ["calendar","Calendar"],
    ["resources","Resources"],
    ["feedback","Feedback"],
    ["analytics","Analytics"],
  ];
  const sub={
    clients:[["overview","Overview"],["plan","Coaching Plan"],["goals","Goals"],["homework","Homework"],["activity","Activity"],["notes","Notes"]],
    messaging:[["coaching","Coaching Inbox"],["seeker","Seeker Inbox"]],
    calendar:[["calendar","Calendar"],["sessions","Sessions"]],
    resources:[["vault","Vault"],["resources","Resources"],["spotlights","Spotlights"]],
    feedback:[["feedback","Client Feedback"]],
    analytics:[["overview","Overview"],["progress","Client Progress"],["sessions","Session Trends"],["outcomes","Outcomes"],["reports","Reports"]],
  };
  return (
    <div style={{border:"1px solid rgba(255,255,255,.22)",borderRadius:18,padding:14,background:"rgba(255,255,255,.68)",backdropFilter:"blur(12px)"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,minmax(0,1fr))",gap:8}}>
        {workspaces.map(([k,l])=>(
          <button key={k} onClick={()=>onWorkspaceChange?.(k)} style={{padding:12,borderRadius:14,fontWeight:700,border:activeWorkspace===k?"1px solid #FF7043":"1px solid #ddd",background:activeWorkspace===k?"rgba(255,112,67,.14)":"white"}}>{l}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:8,overflowX:"auto",marginTop:12}}>
        {(sub[activeWorkspace]||[]).map(([k,l])=>(
          <button key={k} onClick={()=>onSubTabChange?.(k)} style={{padding:"8px 14px",borderRadius:999,fontWeight:700,border:activeSubTab===k?"1px solid #FF7043":"1px solid #ddd",background:activeSubTab===k?"#FF7043":"white",color:activeSubTab===k?"white":"#334155"}}>{l}</button>
        ))}
      </div>
    </div>
  );
}
