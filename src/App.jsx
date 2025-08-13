
import React, { useEffect, useMemo, useState } from 'react'

const LS_KEY = 'recovery-sprint-state-v2'
const THEME_KEY = 'recovery-theme'

// --- FP/CES library ---
// Each exercise: id, name, area, type: 'hold'|'breath'|'mobility', baseSeconds or reps, cues[], setup[], fp=true/false
const EXS = {
  // Leverking lower-body anchors (Good day)
  lk_lateral_adductor_pull: {
    id:'lk_lateral_adductor_pull',
    name:'Leverking Lateral Step + Adductor Pull',
    area:'Adductors/Glute med',
    type:'hold',
    baseSeconds:25,
    setup:[
      'Leverking on shin/foot; band anchored low and lateral',
      'Tripod foot; knee tracks over 2nd toe; pelvis level',
    ],
    cues:[
      'Prep core → gentle inhale → **effort on exhale**',
      'Drive lateral step, pull through adductor; keep ribs stacked over pelvis',
      'Hold tension; micro-pulse 1–2cm if needed without losing alignment',
    ],
    fp:true
  },
  lk_hip_extension_split: {
    id:'lk_hip_extension_split',
    name:'Leverking Split Stance Hip Extension Hold',
    area:'Glute max/hamstrings',
    type:'hold',
    baseSeconds:25,
    setup:[
      'Rear foot loaded via Leverking; front foot tripod; slight forward torso angle',
      'Spine long; ribs down; chin gently tucked',
    ],
    cues:[
      'Prep core → inhale; extend hip **on exhale** without lumbar arch',
      'Squeeze glute; keep adductor loaded; hold until form fades',
    ],
    fp:true
  },
  lk_isometric_adductor: {
    id:'lk_isometric_adductor',
    name:'Leverking Isometric Adductor Hold (wall assist)',
    area:'Adductors/rib stack',
    type:'hold',
    baseSeconds:25,
    setup:[
      'Leverking strap inside foot; band pulling lateral; inside foot near wall',
      'Light wall contact to stack ribs over pelvis',
    ],
    cues:[
      'Prep core → exhale to adduct; hold with even foot tripod',
      'Avoid knee collapse; keep pelvis level',
    ],
    fp:true
  },

  // CES/Protection & Breath (Okay/Flare)
  ces_heel_slide_breath: {
    id:'ces_heel_slide_breath',
    name:'CES Heel Slide with Exhale Effort',
    area:'Core/PF protection',
    type:'breath',
    reps:'2 x 6/side',
    setup:['Supine, neutral pelvis, hands on lower ribs'],
    cues:[
      'Inhale to expand 360° → exhale and slide heel, brace gently (no bearing down)',
      'Stop before rib flare or back arch',
    ]
  },
  ces_supine_march: {
    id:'ces_supine_march',
    name:'CES Supine March (exhale on lift)',
    area:'Core/PF protection',
    type:'breath',
    reps:'2 x 8 slow',
    setup:['Supine, pelvis neutral, ribs stacked'],
    cues:[
      'Prep core → exhale to float knee; inhale to lower with control',
    ]
  },

  // Mobility / MFR add-on
  mfr_pack: {
    id:'mfr_pack',
    name:'MFR: suboccipitals + jaw/ear sweep + foot ball',
    area:'Downreg/MFR',
    type:'mobility',
    reps:'4–5 min total',
    setup:['Soft ball under suboccipitals, gentle jaw/ear lymph sweep, foot ball rolls'],
    cues:['Slow breathing; no pain']
  },

  // Cardio/Lymph
  rowena_z2: {
    id:'rowena_z2',
    name:'Rowena Zone-2 (≈95 BPM)',
    area:'Cardio/Lymph',
    type:'mobility',
    reps:'10–15 min',
    setup:['Easy steady pace, nasal breathing if possible'],
    cues:['Stay conversational, relaxed shoulders']
  }
}

// Week template
const defaultWeek = ()=>{
  const focuses = [
    'Legs + Feet','Core (CES-light)','Arms + Upper Back','Ribs + Breath','Glutes + Adductors','Cardio Focus','Restore & Reset'
  ]
  return Array.from({length:7}).map((_,i)=>({title:`Day ${i+1} – ${focuses[i]}`,notes:'',completed:false}))
}

// Progression: time-under-tension seconds per hold
function holdSeconds(base, week, mood){
  const bump = Math.min(week-1, 9) * 3; // +3s per week up to +27s
  if(mood==='Flare') return Math.max(12, Math.round(base*0.6)); // gentle
  if(mood==='Okay') return Math.round(base + Math.min(bump, 12)); // moderate
  return Math.round(base + bump); // Good day
}

const defaultState = {
  weekNumber:1,
  planName:'10-Week Body Correction Sprint (FP holds + CES protection)',
  theme:(typeof localStorage!=='undefined' && localStorage.getItem?.(THEME_KEY)) || 'auto',
  includeMFR:true,
  mood:'Okay',
  pain:{ribs:2, elbow:2, knee:2, fatigue:2},
  weeks:{1:defaultWeek()},
  // Stacks per mood (FP Leverking anchors on Good)
  stacks:{
    Good:['lk_lateral_adductor_pull','lk_hip_extension_split','lk_isometric_adductor','rowena_z2'],
    Okay:['ces_heel_slide_breath','lk_isometric_adductor','rowena_z2'],
    Flare:['ces_supine_march','rowena_z2']
  },
  doneMap:{},
}

const getTodayIndex=()=> (new Date().getDay()+6)%7

export default function App(){
  const [state, setState] = useState(()=>{
    try{ const raw=localStorage.getItem(LS_KEY); return raw? JSON.parse(raw): defaultState }catch{return defaultState}
  })
  useEffect(()=>{ localStorage.setItem(LS_KEY, JSON.stringify(state)) },[state])

  // Apply theme
  useEffect(()=>{
    const root=document.documentElement
    if(state.theme==='dark') root.setAttribute('data-theme','dark')
    else if(state.theme==='light') root.removeAttribute('data-theme')
    else {
      const prefers = window.matchMedia?.('(prefers-color-scheme: dark)').matches
      if(prefers) root.setAttribute('data-theme','dark'); else root.removeAttribute('data-theme')
    }
    localStorage.setItem(THEME_KEY, state.theme)
  },[state.theme])

  const [dayIndex, setDayIndex] = useState(getTodayIndex())
  const currentWeek = state.weeks[state.weekNumber] || defaultWeek()
  const day = currentWeek[dayIndex]

  // Build prescription list
  const exIds = state.stacks[state.mood] || []
  let list = exIds.map(id => EXS[id]).filter(Boolean)
  if(state.includeMFR && (state.mood==='Good'||state.mood==='Okay')) list = list.concat(EXS.mfr_pack)

  function setMood(mood){ setState(s=>({...s, mood})) }
  function setPain(key,val){ setState(s=>({...s, pain:{...s.pain,[key]:val}})) }
  function toggleTaskDone(id){
    setState(s=>{
      const dayKey=`${s.weekNumber}-${dayIndex}`
      const done = s.doneMap?.[dayKey]?.[id]
      return {...s, doneMap:{...(s.doneMap||{}), [dayKey]:{...(s.doneMap?.[dayKey]||{}), [id]:!done}}}
    )
  }
  function markDayComplete(){
    setState(s=>{
      const wk=[...(s.weeks[s.weekNumber]||currentWeek)]
      wk[dayIndex]={...wk[dayIndex], completed:true}
      return {...s, weeks:{...s.weeks,[s.weekNumber]:wk}}
    })
  }
  function nextDay(){ setDayIndex(i=>(i+1)%7) }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 className="h1">{state.planName}</h1>
          <div className="sub">Week {state.weekNumber} · {day?.title}</div>
        </div>
        <div className="flex">
          <button className="btn" onClick={()=>setState(s=>({...s, weekNumber:Math.max(1,s.weekNumber-1)}))}>Prev wk</button>
          <button className="btn primary" onClick={()=>setState(s=>({...s, weekNumber:s.weekNumber+1, weeks:{...s.weeks, [s.weekNumber+1]:s.weeks[s.weekNumber+1]||defaultWeek()}}))}>Next wk</button>
          <div className="toggle">
            <span style={{fontSize:12}}>Theme</span>
            <select className="select" value={state.theme} onChange={e=>setState(s=>({...s, theme:e.target.value}))}>
              <option value="auto">Auto</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="card">
          <h3>Today’s dial-in</h3>
          <div className="flex">
            {['Good','Okay','Flare'].map(m=>(
              <button key={m} className={`btn ${state.mood===m?'primary':''}`} onClick={()=>setMood(m)}>{m}</button>
            ))}
          </div>
          <div className="grid" style={{marginTop:10}}>
            {Object.entries(state.pain).map(([k,v])=> (
              <div key={k} className="item active">
                <div style={{textTransform:'capitalize'}}>{k}</div>
                <select className="select" value={String(v)} onChange={e=>setPain(k, Number(e.target.value))}>
                  {[0,1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Today’s do-now stack</h3>
          <div className="core-banner">
            <strong>Core prep → gentle inhale → EFFORT ON EXHALE</strong> (lengthen, brace through chain, no bearing down)
          </div>
          <div className="grid">
            {list.map(ex=>{
              const dayKey = `${state.weekNumber}-${dayIndex}`
              const done = state.doneMap?.[dayKey]?.[ex.id] || false
              // Compute display line (hold seconds or reps)
              const line = ex.type==='hold'
                ? `${holdSeconds(ex.baseSeconds, state.weekNumber, state.mood)}s hold`
                : ex.reps
              return (
                <div key={ex.id} className={`item ${done?'done':''}`}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{ex.name} — <span className="sub">{line}</span></div>
                    <div className="sub" style={{fontSize:12}}>{ex.area}</div>
                    <details style={{marginTop:6}}>
                      <summary className="sub" style={{cursor:'pointer'}}>How to / cues</summary>
                      <ul style={{margin:'6px 0 0 16px', fontSize:13}}>
                        {ex.setup?.map((t,i)=><li key={'s'+i}>{t}</li>)}
                        {ex.cues?.map((t,i)=><li key={'c'+i}>{t}</li>)}
                      </ul>
                    </details>
                  </div>
                  <button className={`btn small ${done?'primary':''}`} onClick={()=>toggleTaskDone(ex.id)}>{done?'Done':'Mark done'}</button>
                </div>
              )
            })}
          </div>
          <div className="stack-actions">
            <button className="btn primary" onClick={markDayComplete}>Complete day</button>
            <button className="btn" onClick={nextDay}>Next day</button>
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <h3>Week at a glance</h3>
        <div className="grid week">
          {currentWeek.map((d,i)=>(
            <button key={i} className={`item ${i===dayIndex?'active':''}`} onClick={()=>setDayIndex(i)}>
              <div>
                <div style={{fontWeight:600,fontSize:14}}>{d.title}</div>
                <div className="sub" style={{fontSize:12}}>{d.notes||'No notes yet'}</div>
              </div>
              {d.completed ? <span className="badge">✓</span> : <span className="badge">•</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <h3>Notes for today</h3>
        <textarea value={day?.notes||''} placeholder="How did it feel? Any swaps? Any wins?"
          onChange={e=>{
            setState(s=>{
              const wk=[...(s.weeks[s.weekNumber]||currentWeek)]
              wk[dayIndex]={...wk[dayIndex], notes:e.target.value}
              return {...s, weeks:{...s.weeks,[s.weekNumber]:wk}}
            })
          }}/>
      </div>

      <div className="footer">FP holds + CES breath cues · MFR optional · PWA + Dark mode</div>
    </div>
  )
}
