
import React, { useEffect, useMemo, useState } from 'react'

const LS_KEY='recovery-v11'
const THEME_KEY='recovery-theme'

// Exercise library (FP Leverking + CES + MFR + Rowena)
const EXS = {
  lk_lateral_adductor_pull: {
    id:'lk_lateral_adductor_pull', name:'Leverking Lateral Step + Adductor Pull', area:'Adductors/Glute med',
    type:'hold', baseSeconds:25,
    setup:['Leverking on shin/foot; band anchored low & lateral','Tripod foot; knee over 2nd toe; pelvis level'],
    cues:['Core prep → inhale → **effort on exhale**','Hold tension; tiny pulses w/o losing stack']
  },
  lk_hip_extension_split: {
    id:'lk_hip_extension_split', name:'Leverking Split-Stance Hip Extension Hold', area:'Glute max/Hamstrings',
    type:'hold', baseSeconds:25,
    setup:['Rear foot loaded via Leverking; front foot tripod','Slight forward torso angle; ribs stacked'],
    cues:['Exhale to extend hip (no low-back arch)','Squeeze glute; hold until form fades']
  },
  lk_isometric_adductor: {
    id:'lk_isometric_adductor', name:'Leverking Isometric Adductor Hold (wall assist)', area:'Adductors/Rib stack',
    type:'hold', baseSeconds:25,
    setup:['Leverking inside foot; band pulling lateral','Light wall contact to stack ribs over pelvis'],
    cues:['Exhale to adduct; even foot tripod','Avoid knee collapse; pelvis level']
  },
  ces_heel_slide_breath: {
    id:'ces_heel_slide_breath', name:'CES Heel Slide (exhale on effort)', area:'Core/PF protection',
    type:'breath', reps:'2 x 6/side',
    setup:['Supine neutral pelvis; hands on ribs'],
    cues:['Inhale 360° → exhale to slide heel/brace (no bearing down)','Stop before rib flare/back arch']
  },
  ces_supine_march: {
    id:'ces_supine_march', name:'CES Supine March (exhale on lift)', area:'Core/PF protection',
    type:'breath', reps:'2 x 8 slow',
    setup:['Supine; ribs stacked; pelvis neutral'],
    cues:['Prep core → exhale to float knee; inhale to lower']
  },
  mfr_pack:{
    id:'mfr_pack', name:'MFR: suboccipitals + jaw/ear sweep + foot ball', area:'Downreg/MFR',
    type:'mobility', reps:'4–5 min total',
    setup:['Soft ball under suboccipitals; gentle jaw/ear lymph sweep; foot ball'],
    cues:['Slow breathing; no pain']
  },
  rowena_z2:{
    id:'rowena_z2', name:'Rowena Zone-2 (≈95 BPM)', area:'Cardio/Lymph',
    type:'mobility', reps:'10–15 min',
    setup:['Easy steady pace; nasal breathing if possible'],
    cues:['Conversational effort; relaxed shoulders']
  }
}

const defaultWeek = ()=>{
  const focuses=['Legs + Feet','Core (CES-light)','Arms + Upper Back','Ribs + Breath','Glutes + Adductors','Cardio Focus','Restore & Reset']
  return Array.from({length:7}).map((_,i)=>({title:`Day ${i+1} – ${focuses[i]}`, notes:'', completed:false}))
}

// FP-style progression: increase hold seconds week to week
function holdSeconds(base, week, mood){
  const bump = Math.min(week-1, 9) * 3 // +3s/wk up to +27s
  if(mood==='Flare') return Math.max(12, Math.round(base*0.6))
  if(mood==='Okay') return Math.round(base + Math.min(bump, 12))
  return Math.round(base + bump)
}

export default function App(){
  const [state, setState] = useState(()=>{
    try{const raw=localStorage.getItem(LS_KEY); return raw? JSON.parse(raw) : {
      planName:'Recovery Sprint (FP holds + CES)',
      theme: localStorage.getItem(THEME_KEY) || 'auto',
      includeMFR:true,
      mood:'Okay',
      pain:{ribs:2, elbow:2, knee:2, fatigue:2},
      weekNumber:1,
      weeks:{1:defaultWeek()},
      stacks:{ Good:['lk_lateral_adductor_pull','lk_hip_extension_split','lk_isometric_adductor','rowena_z2'],
               Okay:['ces_heel_slide_breath','lk_isometric_adductor','rowena_z2'],
               Flare:['ces_supine_march','rowena_z2'] },
      doneMap:{},
      showEditor:false
    }}catch{return {
      planName:'Recovery Sprint (FP holds + CES)',
      theme:'auto', includeMFR:true, mood:'Okay',
      pain:{ribs:2, elbow:2, knee:2, fatigue:2},
      weekNumber:1, weeks:{1:defaultWeek()},
      stacks:{ Good:['lk_lateral_adductor_pull','lk_hip_extension_split','lk_isometric_adductor','rowena_z2'],
               Okay:['ces_heel_slide_breath','lk_isometric_adductor','rowena_z2'],
               Flare:['ces_supine_march','rowena_z2'] },
      doneMap:{}, showEditor:false
    }}
  })
  useEffect(()=>{ localStorage.setItem(LS_KEY, JSON.stringify(state)) },[state])

  // Theme apply
  useEffect(()=>{
    const root=document.documentElement
    if(state.theme==='dark') root.setAttribute('data-theme','dark')
    else if(state.theme==='light') root.removeAttribute('data-theme')
    else { const prefers = window.matchMedia?.('(prefers-color-scheme: dark)').matches; if(prefers) root.setAttribute('data-theme','dark'); else root.removeAttribute('data-theme') }
    localStorage.setItem(THEME_KEY, state.theme)
  },[state.theme])

  const [dayIndex, setDayIndex] = useState((new Date().getDay()+6)%7)
  const currentWeek = state.weeks[state.weekNumber] || defaultWeek()
  const day = currentWeek[dayIndex]

  // Build today's list
  let ids = state.stacks[state.mood] || []
  let list = ids.map(id=>EXS[id]).filter(Boolean)
  if(state.includeMFR && (state.mood==='Good'||state.mood==='Okay')) list = list.concat(EXS.mfr_pack)

  // Derived explanation
  const painScore = Object.values(state.pain).reduce((a,b)=>a+Number(b||0),0)
  const rationale = state.mood==='Flare' ? 'Flare day → protective work only'
                   : state.mood==='Okay' ? 'Okay day → technique + moderate holds'
                   : 'Good day → longer FP holds + Rowena'

  // Info modal state
  const [modal, setModal] = useState(null) // exercise or null

  function toggleTaskDone(id){
    setState(s=>{
      const key = `${s.weekNumber}-${dayIndex}`
      const done = s.doneMap?.[key]?.[id]
      return {...s, doneMap:{...(s.doneMap||{}), [key]:{...(s.doneMap?.[key]||{}), [id]:!done}}}
    )
  }

  function markDayComplete(){
    setState(s=>{
      const wk=[...(s.weeks[s.weekNumber]||currentWeek)]
      wk[dayIndex]={...wk[dayIndex], completed:true}
      return {...s, weeks:{...s.weeks,[s.weekNumber]:wk}}
    })
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 className="h1">{state.planName}</h1>
          <div className="sub">Week {state.weekNumber} · {day?.title}</div>
        </div>
        <div className="controls">
          <select className="select" value={state.theme} onChange={e=>setState(s=>({...s, theme:e.target.value}))}>
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <button className="btn" onClick={()=>setState(s=>({...s, weekNumber:Math.max(1,s.weekNumber-1)}))}>Prev wk</button>
          <button className="btn primary" onClick={()=>setState(s=>({...s, weekNumber:s.weekNumber+1, weeks:{...s.weeks,[s.weekNumber+1]:s.weeks[s.weekNumber+1]||defaultWeek()}}))}>Next wk</button>
          <button className="btn" onClick={()=>setState(s=>({...s, showEditor: !s.showEditor}))}>{state.showEditor?'Close edit':'Edit plan'}</button>
        </div>
      </div>

      <div className="card">
        <div className="kv">
          <div className="kv">
            {['Good','Okay','Flare'].map(m=>(
              <button key={m} className={`btn ${state.mood===m?'primary':''}`} onClick={()=>setState(s=>({...s, mood:m}))}>{m}</button>
            ))}
          </div>
          <label className="kv"><input type="checkbox" checked={state.includeMFR} onChange={e=>setState(s=>({...s, includeMFR:e.target.checked}))}/> Include MFR</label>
        </div>
        <div className="help">Pain today (0–4 each):</div>
        <div className="kv">
          {Object.entries(state.pain).map(([k,v])=> (
            <label key={k} className="kv">{k}<select className="select" value={String(v)} onChange={e=>setState(s=>({...s, pain:{...s.pain,[k]:Number(e.target.value)}}))}>{[0,1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
          ))}
        </div>
        <div className="help">Because scores total {painScore}, we’re running: <strong>{rationale}</strong></div>
      </div>

      <div className="card">
        <div className="core-banner"><strong>Core prep → gentle inhale → EFFORT ON EXHALE</strong> (lengthen; brace through chain; no bearing down)</div>
        <h3>Today’s Do‑Now Stack</h3>
        <div className="grid">
          {list.map(ex=>{
            const key = `${state.weekNumber}-${dayIndex}`
            const done = state.doneMap?.[key]?.[ex.id] || false
            const line = ex.type==='hold' ? `${holdSeconds(ex.baseSeconds, state.weekNumber, state.mood)}s hold` : ex.reps
            return (
              <div key={ex.id} className={`item ${done?'done':''}`}>
                <div>
                  <div style={{fontWeight:600,fontSize:14}}>{ex.name} — <span className="sub">{line}</span></div>
                  <div className="sub" style={{fontSize:12}}>{ex.area}</div>
                  <button className="btn small" onClick={()=>setModal(ex)}>How to / cues</button>
                </div>
                <button className={`btn small ${done?'primary':''}`} onClick={()=>toggleTaskDone(ex.id)}>{done?'Done':'Mark done'}</button>
              </div>
            )
          })}
        </div>
        <div className="help">Tip: Tap “How to / cues” on each item to see stance, setup, and breath timing.</div>
        <div className="stack-actions">
          <button className="btn primary" onClick={markDayComplete}>Complete day</button>
          <button className="btn" onClick={()=>setDayIndex(i=>(i+1)%7)}>Next day</button>
        </div>
      </div>

      <div className="card">
        <h3>Week at a glance</h3>
        <div className="grid week-grid">
          {currentWeek.map((d,i)=>(
            <button key={i} className={`item ${i===dayIndex?'active':''}`} onClick={()=>setDayIndex(i)}>
              <div>
                <div style={{fontWeight:600,fontSize:14}}>{d.title}</div>
                <div className="sub">{d.completed? 'Completed' : 'Not done yet'}</div>
              </div>
              <span className="badge">{d.completed?'✓':'•'}</span>
            </button>
          ))}
        </div>
      </div>

      {state.showEditor && (
        <div className="card">
          <h3>Edit plan (advanced)</h3>
          <div className="help">This section is for changing which moves appear on Good/Okay/Flare. Your daily stack above stays read-only.</div>
          {['Good','Okay','Flare'].map(mood=>(
            <div key={mood} className="card">
              <div className="kv"><strong>{mood} day stack</strong></div>
              <div className="grid">
                {state.stacks[mood].map((id,idx)=>(
                  <div key={id} className="item">
                    <div>{EXS[id]?.name || id}</div>
                    <div className="kv">
                      <button className="btn small" onClick={()=>{
                        setState(s=>{
                          const list=[...s.stacks[mood]]; list.splice(idx,1); return {...s, stacks:{...s.stacks,[mood]:list}}
                        })
                      }}>Remove</button>
                      <button className="btn small" onClick={()=>{
                        setState(s=>{
                          const list=[...s.stacks[mood]]; if(idx>0){[list[idx-1],list[idx]]=[list[idx],list[idx-1]]} return {...s, stacks:{...s.stacks,[mood]:list}}
                        })
                      }}>Up</button>
                      <button className="btn small" onClick={()=>{
                        setState(s=>{
                          const list=[...s.stacks[mood]]; if(idx<list.length-1){[list[idx+1],list[idx]]=[list[idx],list[idx+1]]} return {...s, stacks:{...s.stacks,[mood]:list}}
                        })
                      }}>Down</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="kv">
                <select className="select" id={`add-${mood}`}>
                  {Object.values(EXS).map(ex=><option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
                <button className="btn small" onClick={()=>{
                  const sel=document.getElementById(`add-${mood}`); const val=sel?.value
                  if(!val) return
                  setState(s=>({...s, stacks:{...s.stacks,[mood]: [...s.stacks[mood], val]}}))
                }}>Add</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="footer">FP holds + CES cues · PWA offline · Dark mode</div>

      {modal && (
        <div className="modal" onClick={()=>setModal(null)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <h3 style={{marginTop:0}}>{modal.name}</h3>
            <div className="sub" style={{marginBottom:8}}>{modal.area}</div>
            <strong>Setup</strong>
            <ul>{(modal.setup||[]).map((t,i)=><li key={'s'+i}>{t}</li>)}</ul>
            <strong>Cues</strong>
            <ul>{(modal.cues||[]).map((t,i)=><li key={'c'+i}>{t}</li>)}</ul>
            <hr/>
            <button className="btn primary" onClick={()=>setModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
