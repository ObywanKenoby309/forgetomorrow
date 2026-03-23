// pages/recruiter/analytics/snapshot-delivery.js
import { useEffect, useMemo, useState, useCallback } from "react";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";

const GLASS = { border:"1px solid rgba(255,255,255,0.22)",background:"rgba(255,255,255,0.68)",boxShadow:"0 10px 28px rgba(15,23,42,0.12)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)" };
const GLASS_SOFT = { border:"1px solid rgba(255,255,255,0.18)",background:"rgba(255,255,255,0.58)",boxShadow:"0 8px 22px rgba(15,23,42,0.10)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)" };
const ORANGE="#FF7043",SLATE="#334155",MUTED="#64748B";

const REPORTS=[
  {key:"executive",label:"Executive",fullLabel:"Executive Snapshot",description:"Full overview — KPIs, funnel, sources, and AI insights. Best for leadership and C-suite."},
  {key:"funnel",label:"Funnel",fullLabel:"Funnel Report",description:"Application funnel stage breakdown and conversion analysis."},
  {key:"sources",label:"Sources",fullLabel:"Source Performance",description:"Channel performance, candidate origin breakdown, and sourcing ROI signals."},
  {key:"activity",label:"Activity",fullLabel:"Recruiter Activity",description:"Team productivity trends, application volume, and interview scheduling patterns."},
  {key:"time-to-fill",label:"Time-to-Fill",fullLabel:"Time-to-Fill Report",description:"Hiring velocity, role-level fill times, and efficiency benchmarks."},
];

const FALLBACK_TIMEZONES=["UTC","America/Anchorage","America/Los_Angeles","America/Phoenix","America/Denver","America/Chicago","America/New_York","America/Toronto","America/Halifax","America/Sao_Paulo","America/Buenos_Aires","Europe/London","Europe/Paris","Europe/Berlin","Europe/Helsinki","Europe/Istanbul","Africa/Cairo","Africa/Johannesburg","Africa/Lagos","Africa/Nairobi","Asia/Jerusalem","Asia/Riyadh","Asia/Dubai","Asia/Karachi","Asia/Kolkata","Asia/Bangkok","Asia/Singapore","Asia/Shanghai","Asia/Tokyo","Australia/Sydney","Pacific/Auckland"];
const TIMEZONE_LABEL_MAP={"UTC":"Coordinated Universal Time","America/Anchorage":"Alaska Time","America/Los_Angeles":"Pacific Time","America/Phoenix":"Mountain Time (AZ)","America/Denver":"Mountain Time","America/Chicago":"Central Time","America/New_York":"Eastern Time","America/Toronto":"Eastern Time (Canada)","America/Halifax":"Atlantic Time","America/Sao_Paulo":"Brasilia Time","America/Buenos_Aires":"Argentina Time","Europe/London":"GMT / London","Europe/Paris":"Central European Time","Europe/Berlin":"Central European Time","Europe/Helsinki":"Eastern European Time","Europe/Istanbul":"Turkey Time","Africa/Cairo":"Egypt Time","Africa/Johannesburg":"South Africa Time","Africa/Lagos":"West Africa Time","Africa/Nairobi":"East Africa Time","Asia/Jerusalem":"Israel Time","Asia/Riyadh":"Arabia Standard Time","Asia/Dubai":"Gulf Standard Time","Asia/Karachi":"Pakistan Time","Asia/Kolkata":"India Time","Asia/Bangkok":"Indochina Time","Asia/Singapore":"Singapore Time","Asia/Shanghai":"China Time","Asia/Tokyo":"Japan Time","Australia/Sydney":"Australian Eastern Time","Pacific/Auckland":"New Zealand Time"};
const WEEKDAY_OPTIONS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const ORDINAL_OPTIONS=["First","Second","Third","Fourth","Last"];

function prettyTZ(tz){if(!tz)return"—";if(tz==="UTC")return"UTC";const label=TIMEZONE_LABEL_MAP[tz]||"Time Zone";const city=tz.split("/").slice(1).join(" / ").replace(/_/g," ");return`${label} | ${city}`;}
function detectLocalTZ(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||"America/Chicago";}catch{return"America/Chicago";}}
const LOCAL_TZ=detectLocalTZ();

function defaultSchedule(reportType){return{reportType,recipients:"",cadence:"weekly",timezone:LOCAL_TZ,timeOfDay:"08:00",weeklyDay:"Monday",monthlyMode:"date",monthlyDate:"1",monthlyOrdinal:"First",monthlyWeekday:"Monday",includePng:true,includeInsights:true,sendToSelf:false};}

function FieldLabel({children}){return <div style={{fontSize:12,fontWeight:800,color:SLATE,marginBottom:6}}>{children}</div>;}
function Input(props){return <input {...props} style={{width:"100%",borderRadius:10,border:"1px solid rgba(51,65,85,0.14)",background:"rgba(255,255,255,0.88)",color:SLATE,fontSize:13,padding:"10px 12px",outline:"none",boxSizing:"border-box",...(props.style||{})}} />;}
function Select(props){return <select {...props} style={{width:"100%",borderRadius:10,border:"1px solid rgba(51,65,85,0.14)",background:"rgba(255,255,255,0.88)",color:SLATE,fontSize:13,padding:"10px 12px",outline:"none",boxSizing:"border-box",...(props.style||{})}} />;}
function Textarea(props){return <textarea {...props} style={{width:"100%",minHeight:90,borderRadius:10,border:"1px solid rgba(51,65,85,0.14)",background:"rgba(255,255,255,0.88)",color:SLATE,fontSize:13,padding:"10px 12px",resize:"vertical",outline:"none",boxSizing:"border-box",...(props.style||{})}} />;}
function PillButton({active,onClick,children,small}){return <button type="button" onClick={onClick} style={{borderRadius:999,padding:small?"6px 12px":"9px 16px",fontWeight:800,fontSize:small?12:13,border:"none",cursor:"pointer",background:active?ORANGE:"rgba(255,255,255,0.75)",color:active?"#fff":SLATE,whiteSpace:"nowrap"}}>{children}</button>;}
function ToggleRow({checked,onChange,label,hint}){return <label style={{...GLASS_SOFT,borderRadius:12,padding:12,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,cursor:"pointer"}}><div><div style={{fontSize:13,fontWeight:800,color:SLATE}}>{label}</div>{hint&&<div style={{fontSize:12,color:MUTED,marginTop:4,lineHeight:1.5}}>{hint}</div>}</div><input type="checkbox" checked={checked} onChange={onChange} /></label>;}

function metricValue(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (!Number.isNaN(num)) return `${num.toLocaleString()}${suffix}`;
  return `${value}${suffix}`;
}

function PreviewPanel({ report, previewData, loadingPreview }) {
  if (loadingPreview) {
    return (
      <div style={{...GLASS,borderRadius:18,padding:16}}>
        <div style={{fontSize:16,fontWeight:900,color:SLATE,marginBottom:8}}>Preview Snapshot</div>
        <div style={{fontSize:13,color:MUTED}}>Generating preview...</div>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div style={{...GLASS,borderRadius:18,padding:16,display:"grid",gap:12,minHeight:420}}>
        <div>
          <div style={{fontSize:16,fontWeight:900,color:SLATE}}>Preview Snapshot</div>
          <div style={{fontSize:13,color:MUTED,marginTop:4}}>
            Generate a preview to see the report content that will be used for preview and send.
          </div>
        </div>
      </div>
    );
  }

  const { kpis = {}, funnelData = [], sourcesData = [], activityData = [], previewInsight } = previewData;

  const maxFunnel = Math.max(...funnelData.map((d) => Number(d.value || 0)), 1);
  const totalSources = sourcesData.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  const maxActivityMessages = Math.max(...activityData.map((d) => Number(d.messages || 0)), 1);
  const maxActivityResponses = Math.max(...activityData.map((d) => Number(d.responses || 0)), 1);

  return (
    <div style={{...GLASS,borderRadius:18,padding:16,display:"grid",gap:16,height:"100%"}}>
      <div>
        <div style={{fontSize:16,fontWeight:900,color:SLATE}}>Preview Snapshot</div>
        <div style={{fontSize:13,color:MUTED,marginTop:4}}>
          This is the report content that will be used for preview and send.
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3, minmax(0, 1fr))",gap:10}}>
        <div style={{...GLASS_SOFT,borderRadius:12,padding:12}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:MUTED}}>Job Views</div>
          <div style={{fontSize:24,fontWeight:900,color:SLATE,marginTop:4}}>{metricValue(kpis.totalViews ?? kpis.jobViews)}</div>
        </div>
        <div style={{...GLASS_SOFT,borderRadius:12,padding:12}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:MUTED}}>Applications</div>
          <div style={{fontSize:24,fontWeight:900,color:SLATE,marginTop:4}}>{metricValue(kpis.totalApplies ?? kpis.applies)}</div>
        </div>
        <div style={{...GLASS_SOFT,borderRadius:12,padding:12}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:MUTED}}>Conversion</div>
          <div style={{fontSize:24,fontWeight:900,color:SLATE,marginTop:4}}>{metricValue(kpis.conversionRatePct ?? kpis.conversionRate, "%")}</div>
        </div>
        <div style={{...GLASS_SOFT,borderRadius:12,padding:12}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:MUTED}}>Time to Fill</div>
          <div style={{fontSize:24,fontWeight:900,color:SLATE,marginTop:4}}>{metricValue(kpis.avgTimeToFillDays ?? kpis.avgTimeToFill, " days")}</div>
        </div>
        <div style={{...GLASS_SOFT,borderRadius:12,padding:12}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:MUTED}}>Interviews</div>
          <div style={{fontSize:24,fontWeight:900,color:SLATE,marginTop:4}}>{metricValue(kpis.totalInterviews)}</div>
        </div>
        <div style={{...GLASS_SOFT,borderRadius:12,padding:12}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:MUTED}}>Hires</div>
          <div style={{fontSize:24,fontWeight:900,color:SLATE,marginTop:4}}>{metricValue(kpis.totalHires)}</div>
        </div>
      </div>

      {previewInsight && (
        <div style={{background:"rgba(255,112,67,0.08)",border:"1px solid rgba(255,112,67,0.20)",borderLeft:"4px solid #FF7043",borderRadius:12,padding:"14px 16px"}}>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:ORANGE,marginBottom:8}}>AI Insight</div>
          <div style={{fontSize:14,color:SLATE,lineHeight:1.65}}>{previewInsight}</div>
        </div>
      )}

      {(report.key === "executive" || report.key === "funnel") && funnelData.length > 0 && (
        <div style={{...GLASS_SOFT,borderRadius:14,padding:14}}>
          <div style={{fontSize:13,fontWeight:900,color:SLATE,marginBottom:10}}>Application Funnel</div>
          <div style={{display:"grid",gap:8}}>
            {funnelData.map((item) => {
              const pct = Math.round((Number(item.value || 0) / maxFunnel) * 100);
              return (
                <div key={item.stage} style={{display:"grid",gridTemplateColumns:"120px 1fr 60px",gap:10,alignItems:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color:SLATE}}>{item.stage}</div>
                  <div style={{height:16,background:"rgba(148,163,184,0.16)",borderRadius:999,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#F57C00,#FFB74D)",borderRadius:999}} />
                  </div>
                  <div style={{fontSize:12,fontWeight:800,color:SLATE,textAlign:"right"}}>{metricValue(item.value)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(report.key === "executive" || report.key === "sources") && sourcesData.length > 0 && (
        <div style={{...GLASS_SOFT,borderRadius:14,padding:14}}>
          <div style={{fontSize:13,fontWeight:900,color:SLATE,marginBottom:10}}>Source Performance</div>
          <div style={{display:"grid",gap:8}}>
            {sourcesData.map((item) => {
              const pct = Math.round((Number(item.value || 0) / totalSources) * 100);
              return (
                <div key={item.name} style={{display:"grid",gridTemplateColumns:"140px 1fr 50px",gap:10,alignItems:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color:SLATE}}>{item.name}</div>
                  <div style={{height:16,background:"rgba(148,163,184,0.16)",borderRadius:999,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:"rgba(255,112,67,0.85)",borderRadius:999}} />
                  </div>
                  <div style={{fontSize:12,fontWeight:800,color:SLATE,textAlign:"right"}}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {report.key === "activity" && activityData.length > 0 && (
        <div style={{...GLASS_SOFT,borderRadius:14,padding:14}}>
          <div style={{fontSize:13,fontWeight:900,color:SLATE,marginBottom:10}}>Recruiter Activity</div>
          <div style={{display:"grid",gap:8}}>
            {activityData.map((item) => {
              const msgPct = Math.round((Number(item.messages || 0) / maxActivityMessages) * 100);
              const rspPct = Math.round((Number(item.responses || 0) / maxActivityResponses) * 100);
              return (
                <div key={item.week} style={{display:"grid",gridTemplateColumns:"50px 1fr 1fr",gap:10,alignItems:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color:SLATE}}>{item.week}</div>
                  <div>
                    <div style={{fontSize:10,color:MUTED,marginBottom:4}}>Applications</div>
                    <div style={{height:14,background:"rgba(148,163,184,0.16)",borderRadius:999,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${msgPct}%`,background:"rgba(255,152,0,0.9)",borderRadius:999}} />
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:MUTED,marginBottom:4}}>Interviews</div>
                    <div style={{height:14,background:"rgba(148,163,184,0.16)",borderRadius:999,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${rspPct}%`,background:"rgba(33,150,243,0.9)",borderRadius:999}} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {report.key === "time-to-fill" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{...GLASS_SOFT,borderRadius:12,padding:14,textAlign:"center"}}>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:MUTED}}>Avg. Time to Fill</div>
            <div style={{fontSize:34,fontWeight:900,color:ORANGE,marginTop:6}}>{metricValue(kpis.avgTimeToFillDays ?? kpis.avgTimeToFill)}</div>
            <div style={{fontSize:12,color:MUTED,marginTop:2}}>days</div>
          </div>
          <div style={{...GLASS_SOFT,borderRadius:12,padding:14,textAlign:"center"}}>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:MUTED}}>Total Hires</div>
            <div style={{fontSize:34,fontWeight:900,color:SLATE,marginTop:6}}>{metricValue(kpis.totalHires)}</div>
            <div style={{fontSize:12,color:MUTED,marginTop:2}}>this period</div>
          </div>
        </div>
      )}
    </div>
  );
}

function AllOverview({schedules,onSelectReport}){
  return <div style={{display:"grid",gap:12}}>
    <div style={{fontSize:14,color:MUTED,marginBottom:4}}>Each report has its own schedule, recipients, and timing. Click any report to configure it.</div>
    {REPORTS.map((report)=>{
      const s=schedules[report.key];
      const hasSchedule=s?.cadence&&s?.recipients;
      const recipientCount=s?.recipients?s.recipients.split(",").filter(r=>r.trim()).length:0;
      return <div key={report.key} onClick={()=>onSelectReport(report.key)} style={{...GLASS_SOFT,borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,justifyContent:"space-between"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <div style={{fontSize:15,fontWeight:900,color:SLATE}}>{report.fullLabel}</div>
            {hasSchedule?<span style={{fontSize:10,fontWeight:800,background:"rgba(255,112,67,0.12)",color:ORANGE,borderRadius:6,padding:"2px 8px"}}>Active</span>:<span style={{fontSize:10,fontWeight:800,background:"rgba(100,116,139,0.10)",color:MUTED,borderRadius:6,padding:"2px 8px"}}>Not configured</span>}
          </div>
          <div style={{fontSize:12,color:MUTED}}>{report.description}</div>
          {hasSchedule&&<div style={{fontSize:12,color:SLATE,marginTop:6,fontWeight:700}}>{s.cadence.charAt(0).toUpperCase()+s.cadence.slice(1)} · {s.timeOfDay} · {prettyTZ(s.timezone)} · {recipientCount} recipient{recipientCount!==1?"s":""}</div>}
        </div>
        <div style={{fontSize:18,color:MUTED,flexShrink:0}}>→</div>
      </div>;
    })}
  </div>;
}

function ReportScheduleEditor({report,schedule,onSave,onSendNow,onPreview,saving,sending,previewing,previewData,isMobile}){
  const [s,setS]=useState(schedule||defaultSchedule(report.key));
  const [tzSearch,setTzSearch]=useState("");
  useEffect(()=>{setS(schedule||defaultSchedule(report.key));},[report.key,schedule]);
  const update=(patch)=>setS(prev=>({...prev,...patch}));

  const allTimezones=useMemo(()=>{
    let zones=[];
    try{if(typeof Intl?.supportedValuesOf==="function")zones=Intl.supportedValuesOf("timeZone");}catch{zones=[];}
    if(!zones.length)zones=FALLBACK_TIMEZONES;
    return Array.from(new Set([...zones,...FALLBACK_TIMEZONES,"UTC"])).sort((a,b)=>a.localeCompare(b));
  },[]);

  const filteredTZs=useMemo(()=>{
    const q=tzSearch.trim().toLowerCase();
    if(!q)return allTimezones;
    return allTimezones.filter(tz=>tz.toLowerCase().includes(q)||(TIMEZONE_LABEL_MAP[tz]||"").toLowerCase().includes(q));
  },[allTimezones,tzSearch]);

  const parsedRecipients=s.recipients.split(",").map(r=>r.trim()).filter(Boolean);

  const workspaceStyle = isMobile
    ? {
        display: "grid",
        gap: 14,
      }
    : {
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr",
        gridTemplateAreas: `
          "head head"
          "recipients preview"
          "schedule preview"
          "content preview"
          "footer footer"
        `,
        gap: 14,
        alignItems: "start",
      };

  return (
    <div style={workspaceStyle}>
      <div style={{...(isMobile ? {} : { gridArea: "head" }), display:"grid", gridTemplateColumns:isMobile ? "1fr" : "1.1fr 0.9fr", gap:14, alignItems:"start"}}>
        <div style={{...GLASS_SOFT,borderRadius:12,padding:"12px 14px"}}>
          <div style={{fontSize:13,color:MUTED,lineHeight:1.6}}>{report.description}</div>
        </div>
        <div style={{display:isMobile ? "none" : "block"}} />
      </div>

      <div style={{...GLASS,borderRadius:18,padding:16, ...(isMobile ? {} : { gridArea: "recipients" })}}>
        <div style={{fontSize:16,fontWeight:900,color:SLATE,marginBottom:4}}>Recipients</div>
        <div style={{fontSize:13,color:MUTED,marginBottom:12}}>Who receives this specific report. Separate with commas.</div>
        <Textarea value={s.recipients} onChange={e=>update({recipients:e.target.value})} placeholder="ceo@company.com, board@company.com" style={{minHeight:72,resize:"none"}} />
        <div style={{marginTop:10,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
          <ToggleRow checked={s.sendToSelf} onChange={e=>update({sendToSelf:e.target.checked})} label="Send a copy to me" hint="Get a confirmation copy on every send." />
          <div style={{...GLASS_SOFT,borderRadius:12,padding:"8px 14px",textAlign:"center",minWidth:72}}>
            <div style={{fontSize:10,fontWeight:700,color:MUTED,textTransform:"uppercase"}}>Recipients</div>
            <div style={{fontSize:24,fontWeight:900,color:ORANGE,lineHeight:1.1,marginTop:2}}>{parsedRecipients.length}</div>
          </div>
        </div>
      </div>

      <div style={{...GLASS,borderRadius:18,padding:16, ...(isMobile ? {} : { gridArea: "schedule" })}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",marginBottom:14}}>
          <div>
            <div style={{fontSize:16,fontWeight:900,color:SLATE}}>Delivery Schedule</div>
            <div style={{fontSize:13,color:MUTED,marginTop:2}}>When this report is automatically sent.</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            {["daily","weekly","monthly"].map(c=><PillButton key={c} active={s.cadence===c} onClick={()=>update({cadence:c})} small>{c.charAt(0).toUpperCase()+c.slice(1)}</PillButton>)}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><FieldLabel>Search time zone</FieldLabel><Input type="text" value={tzSearch} onChange={e=>setTzSearch(e.target.value)} placeholder="Search city or zone..." /></div>
          <div><FieldLabel>Time zone</FieldLabel><Select value={s.timezone} onChange={e=>update({timezone:e.target.value})} size={5}>{filteredTZs.map(tz=><option key={tz} value={tz}>{prettyTZ(tz)}</option>)}</Select></div>
        </div>

        <div style={{fontSize:12,color:MUTED,marginBottom:14}}>
          📍 Your location: <strong style={{color:SLATE}}>{prettyTZ(LOCAL_TZ)}</strong>
          {s.timezone!==LOCAL_TZ&&<button type="button" onClick={()=>update({timezone:LOCAL_TZ})} style={{marginLeft:10,fontSize:11,fontWeight:700,color:ORANGE,background:"none",border:"none",cursor:"pointer",textDecoration:"underline",padding:0}}>↩ Use my location</button>}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div><FieldLabel>Delivery time</FieldLabel><Input type="time" value={s.timeOfDay} onChange={e=>update({timeOfDay:e.target.value})} /></div>
          <div>
            {s.cadence==="weekly"&&<><FieldLabel>Day of week</FieldLabel><Select value={s.weeklyDay} onChange={e=>update({weeklyDay:e.target.value})}>{WEEKDAY_OPTIONS.map(d=><option key={d} value={d}>{d}</option>)}</Select></>}
            {s.cadence==="monthly"&&<><FieldLabel>Monthly rule</FieldLabel><div style={{display:"flex",borderRadius:10,border:"1px solid rgba(51,65,85,0.14)",overflow:"hidden",marginBottom:10}}>{[{value:"date",label:"Specific date"},{value:"ordinal",label:"Ordinal weekday"}].map(opt=><button key={opt.value} type="button" onClick={()=>update({monthlyMode:opt.value})} style={{flex:1,padding:"8px 10px",border:"none",background:s.monthlyMode===opt.value?SLATE:"transparent",color:s.monthlyMode===opt.value?"#fff":MUTED,fontWeight:800,fontSize:12,cursor:"pointer"}}>{opt.label}</button>)}</div>{s.monthlyMode==="date"?<Select value={s.monthlyDate} onChange={e=>update({monthlyDate:e.target.value})}>{Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={String(d)}>{d}</option>)}</Select>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><Select value={s.monthlyOrdinal} onChange={e=>update({monthlyOrdinal:e.target.value})}>{ORDINAL_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}</Select><Select value={s.monthlyWeekday} onChange={e=>update({monthlyWeekday:e.target.value})}>{WEEKDAY_OPTIONS.map(d=><option key={d} value={d}>{d}</option>)}</Select></div>}</>}
            {s.cadence==="daily"&&<div style={{...GLASS_SOFT,borderRadius:10,padding:12,height:"100%",display:"flex",alignItems:"center"}}><div style={{fontSize:13,color:MUTED}}>Sends every day at the selected time.</div></div>}
          </div>
        </div>
      </div>

      <div style={{...GLASS,borderRadius:18,padding:16, ...(isMobile ? {} : { gridArea: "content" })}}>
        <div style={{fontSize:16,fontWeight:900,color:SLATE,marginBottom:12}}>Content Options</div>
        <div style={{display:"grid",gap:10}}>
          <ToggleRow checked={s.includeInsights} onChange={e=>update({includeInsights:e.target.checked})} label="Include AI insights" hint="Adds a Groq-powered insight paragraph tailored to this report's data." />
          <ToggleRow checked={s.includePng} onChange={e=>update({includePng:e.target.checked})} label="Include HTML data visuals" hint="Embeds inline chart visualizations designed for email and stakeholder review." />
        </div>
      </div>

      <div style={isMobile ? {} : { gridArea: "preview", alignSelf: "stretch" }}>
        <PreviewPanel report={report} previewData={previewData} loadingPreview={previewing} />
      </div>

      <div style={{
        ...(isMobile ? {} : { gridArea: "footer" }),
        display:"flex",
        gap:10,
        justifyContent:"flex-start",
        alignItems:"center",
        flexWrap:"wrap"
      }}>
        <button onClick={()=>onPreview(s)} disabled={previewing} style={{borderRadius:10,background:"rgba(255,255,255,0.75)",color:SLATE,fontWeight:800,padding:"12px 16px",border:"1px solid rgba(51,65,85,0.14)",cursor:previewing?"not-allowed":"pointer",fontSize:14,opacity:previewing?0.6:1}}>
          {previewing?"Generating...":"Preview Snapshot"}
        </button>
        <button onClick={()=>onSendNow(s)} disabled={sending||!parsedRecipients.length} style={{borderRadius:10,background:"rgba(255,255,255,0.75)",color:SLATE,fontWeight:800,padding:"12px 16px",border:"1px solid rgba(51,65,85,0.14)",cursor:sending||!parsedRecipients.length?"not-allowed":"pointer",fontSize:14,opacity:sending||!parsedRecipients.length?0.6:1}}>
          {sending?"Sending...":"Send Now"}
        </button>
        <button onClick={()=>onSave(s)} disabled={saving||!parsedRecipients.length} style={{borderRadius:10,background:ORANGE,color:"#fff",fontWeight:800,padding:"12px 24px",border:"none",cursor:saving||!parsedRecipients.length?"not-allowed":"pointer",fontSize:14,opacity:saving||!parsedRecipients.length?0.7:1,boxShadow:"0 4px 14px rgba(255,112,67,0.30)"}}>
          {saving?"Saving...":"Save Schedule"}
        </button>
      </div>
    </div>
  );
}

export default function SnapshotDeliveryPage(){
  const [isMobile,setIsMobile]=useState(false);
  const [activeTab,setActiveTab]=useState("all");
  const [schedules,setSchedules]=useState({});
  const [loadingTabs,setLoadingTabs]=useState({});
  const [savingTab,setSavingTab]=useState(null);
  const [sendingTab,setSendingTab]=useState(null);
  const [previewingTab,setPreviewingTab]=useState(null);
  const [previewByTab,setPreviewByTab]=useState({});

  useEffect(()=>{const check=()=>setIsMobile(window.innerWidth<1024);check();window.addEventListener("resize",check);return()=>window.removeEventListener("resize",check);},[]);

  useEffect(()=>{
    const loading={};REPORTS.forEach(r=>{loading[r.key]=true;});setLoadingTabs(loading);
    Promise.all(REPORTS.map(report=>fetch(`/api/analytics/save-snapshot-schedule?reportType=${report.key}`).then(r=>r.json()).then(data=>({reportType:report.key,schedule:data?.schedule||null})).catch(()=>({reportType:report.key,schedule:null})))).then(results=>{
      const loaded={};const doneLoading={};
      results.forEach(({reportType,schedule})=>{loaded[reportType]=schedule;doneLoading[reportType]=false;});
      setSchedules(loaded);setLoadingTabs(doneLoading);
    });
  },[]);

  const handleSave=useCallback(async(scheduleData)=>{
    const{reportType}=scheduleData;setSavingTab(reportType);
    try{
      const res=await fetch("/api/analytics/save-snapshot-schedule",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(scheduleData)});
      const data=await res.json();
      if(data.success){setSchedules(prev=>({...prev,[reportType]:data.schedule}));alert(`${REPORTS.find(r=>r.key===reportType)?.fullLabel||reportType} schedule saved.`);}
      else alert(data.error||"Failed to save");
    }catch{alert("Error saving schedule");}
    setSavingTab(null);
  },[]);

  const handlePreview=useCallback(async(scheduleData)=>{
    const { reportType } = scheduleData;
    setPreviewingTab(reportType);
    try{
      const res=await fetch("/api/analytics/generate-snapshot",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(scheduleData)});
      const data=await res.json();
      if(data.success){
        setPreviewByTab(prev=>({...prev,[reportType]:data}));
      } else {
        alert(data.error||"Failed to generate preview");
      }
    }catch{
      alert("Error generating preview");
    }
    setPreviewingTab(null);
  },[]);

  const handleSendNow=useCallback(async(scheduleData)=>{
    const{reportType,recipients,sendToSelf}=scheduleData;
    const parsedRecipients=recipients.split(",").map(r=>r.trim()).filter(Boolean);
    if(!parsedRecipients.length){alert("Add at least one recipient before sending.");return;}

    setSendingTab(reportType);
    try{
      let snapshotPayload = previewByTab[reportType];

      if(!snapshotPayload){
        const previewRes=await fetch("/api/analytics/generate-snapshot",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(scheduleData)});
        const previewData=await previewRes.json();
        if(!previewData.success){
          alert(previewData.error||"Failed to generate snapshot data");
          setSendingTab(null);
          return;
        }
        snapshotPayload = previewData;
        setPreviewByTab(prev=>({...prev,[reportType]:previewData}));
      }

      let finalRecipients = [...parsedRecipients];
      if (sendToSelf) {
        const selfEmail = snapshotPayload?.userEmail || "";
        if (selfEmail && !finalRecipients.includes(selfEmail)) {
          finalRecipients.push(selfEmail);
        }
      }

      const res=await fetch("/api/analytics/send-snapshot",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          ...scheduleData,
          ...snapshotPayload,
          recipients: finalRecipients,
          reportingWindow: snapshotPayload.reportingWindow || "Current period",
          accountName: snapshotPayload.accountName || "ForgeTomorrow Demo Account",
          recruiterName: snapshotPayload.recruiterName || "Recruiter Team",
        })
      });

      const data=await res.json();
      if(data.success)alert(`${REPORTS.find(r=>r.key===reportType)?.fullLabel||reportType} sent.`);
      else alert(data.error||"Failed to send");
    }catch{
      alert("Error sending snapshot");
    }
    setSendingTab(null);
  },[previewByTab]);

  const activeReport=REPORTS.find(r=>r.key===activeTab);

  const rightRail=<div style={{display:"grid",gap:12}}><div style={{...GLASS_SOFT,borderRadius:12,padding:14}}><div style={{fontSize:10,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:"#94A3B8",marginBottom:8}}>Sponsored</div><div style={{borderRadius:12,border:"1px dashed rgba(100,116,139,0.24)",background:"rgba(255,255,255,0.60)",minHeight:180,display:"flex",alignItems:"center",justifyContent:"center",padding:16,textAlign:"center",color:"#94A3B8",fontSize:13,fontWeight:700}}>Reserved ad / sponsor panel</div></div></div>;

  return <RecruiterLayout title="Snapshot Delivery Center" pageTitle="Snapshot Delivery Center" pageSubtitle="Per-report delivery schedules. Each report has its own recipients, timing, and cadence." right={rightRail} activeNav="analytics">
    <div style={{display:"grid",gap:14,paddingTop:30}}>
      <section style={{...GLASS,borderRadius:18,padding:16,textAlign:"center"}}>
        <div style={{fontSize:24,fontWeight:900,color:ORANGE}}>Snapshot Delivery Center</div>
        <div style={{fontSize:14,color:MUTED,marginTop:6,maxWidth:560,margin:"8px auto 0"}}>Each report has its own schedule. Set different recipients, timing, and cadence per report type — your settings never affect anyone else's.</div>
      </section>

      <div style={{...GLASS,borderRadius:18,padding:"12px 16px"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <PillButton active={activeTab==="all"} onClick={()=>setActiveTab("all")}>All Reports</PillButton>
          {REPORTS.map(report=>{
            const s=schedules[report.key];
            const isActive=s?.recipients&&s.recipients.trim().length>0;
            return <div key={report.key} style={{position:"relative"}}>
              <PillButton active={activeTab===report.key} onClick={()=>setActiveTab(report.key)}>{report.label}</PillButton>
              {isActive&&<div style={{position:"absolute",top:-2,right:-2,width:8,height:8,borderRadius:"50%",background:ORANGE,border:"2px solid white"}} />}
            </div>;
          })}
        </div>
      </div>

      {activeTab==="all"
        ? <section style={{...GLASS,borderRadius:18,padding:16}}>
            <AllOverview schedules={schedules} onSelectReport={key=>setActiveTab(key)} />
          </section>
        : activeReport
          ? <section style={{...GLASS,borderRadius:18,padding:16,marginTop:32}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <button type="button" onClick={()=>setActiveTab("all")} style={{fontSize:12,fontWeight:700,color:MUTED,background:"none",border:"none",cursor:"pointer",padding:0}}>← All Reports</button>
                <div style={{fontSize:20,fontWeight:900,color:SLATE}}>{activeReport.fullLabel}</div>
              </div>
              {loadingTabs[activeReport.key]
                ? <div style={{textAlign:"center",padding:40,color:MUTED,fontSize:13}}>Loading schedule...</div>
                : <ReportScheduleEditor
                    report={activeReport}
                    schedule={schedules[activeReport.key]}
                    onSave={handleSave}
                    onSendNow={handleSendNow}
                    onPreview={handlePreview}
                    saving={savingTab===activeReport.key}
                    sending={sendingTab===activeReport.key}
                    previewing={previewingTab===activeReport.key}
                    previewData={previewByTab[activeReport.key] || null}
                    isMobile={isMobile}
                  />
              }
            </section>
          : null}
    </div>
  </RecruiterLayout>;
}