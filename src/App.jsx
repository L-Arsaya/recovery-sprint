
import React, { useEffect, useMemo, useState } from 'react'

const LS_KEY = 'recovery-sprint-state-v1'

const defaultExercises = {
  Good: [
    { id: 'fp-bow', name: 'FP Bow/Arrow – 3 x 6 slow reps', area: 'Whole body' },
    { id: 'fp-standing', name: 'FP Standing 1-arm press – 3 x 8/side', area: 'Upper body' },
    { id: 'adductors-wall', name: 'Adductor wall press – 3 x 30s/side', area: 'Adductors' },
    { id: 'glute-hinge', name: 'Banded hip hinge to row – 3 x 10', area: 'Glutes/Core' },
    { id: 'feet-tripod', name: 'Toe spacer splay + tripod foot – 2 x 60s', area: 'Feet/Bunion' },
    { id: 'rowena-z2', name: 'Rowena Z2 12–15 min @ ~95 BPM', area: 'Cardio/Lymph' },
    { id: 'vibe-drain', name: 'Vibration plate lymph flush – 3 min', area: 'Lymphatic' },
  ],
  Okay: [
    { id: 'rib-decomp', name: 'Rib decompression (supine, supported) – 4 x 5 slow breaths', area: 'Ribs/Breathing' },
    { id: 'ces-heel-slide', name: 'CES Heel slide with breath – 2 x 8/side', area: 'Core (CES)' },
    { id: 'adductor-mini', name: 'Mini adductor squeeze (ball) – 3 x 20s', area: 'Adductors' },
    { id: 'feet-calf-bias', name: 'Calf raise with medial bias – 2 x 8', area: 'Feet/Calf' },
    { id: 'rebound-light', name: 'Rebounder gentle bounce – 3–5 min', area: 'Lymph' },
  ],
  Flare: [
    { id: 'ns-breath', name: 'Box breathing 4-4-6-2 – 3 min', area: 'Nervous system' },
    { id: 'lymph-sweep', name: 'Lymph sweep (neck/ear/jaw) – 2 min', area: 'Lymph' },
    { id: 'pf-relax', name: 'PF downtraining (long sighs) – 2 min', area: 'Pelvic floor relax' },
    { id: 'ces-supine', name: 'CES Supine marching – 2 x 8/side', area: 'Core (CES)' },
    { id: 'walk-easy', name: '5–10 min easy walk or floor mobility', area: 'Gentle movement' },
  ],
}

const defaultWeek = () => {
  const focuses = [
    'Legs + Feet',
    'Core (CES-light)',
    'Arms + Upper Back',
    'Ribs + Breath',
    'Glutes + Adductors',
    'Cardio Focus',
    'Restore & Reset',
  ]
  return Array.from({ length: 7 }).map((_, i) => ({
    title: `Day ${i + 1} – ${focuses[i]}`,
    notes: '',
    completed: false,
  }))
}

const defaultState = {
  weekNumber: 1,
  planName: '10‑Week Body Correction Sprint',
  mood: 'Okay',
  pain: { ribs: 2, elbow: 2, knee: 2, fatigue: 2 },
  weeks: { 1: defaultWeek() },
  customExercises: defaultExercises,
  doneMap: {},
}

const getTodayIndex = () => {
  const d = new Date()
  return (d.getDay() + 6) % 7 // make Monday index 0-ish
}

export default function App() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      return raw ? JSON.parse(raw) : defaultState
    } catch {
      return defaultState
    }
  })
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  }, [state])

  const [dayIndex, setDayIndex] = useState(getTodayIndex())
  const currentWeek = state.weeks[state.weekNumber] || defaultWeek()
  const day = currentWeek[dayIndex]

  const prescription = useMemo(() => {
    const mood = state.mood
    const totalPain = Object.values(state.pain).reduce((a, b) => a + Number(b || 0), 0)
    if (mood === 'Good' && totalPain >= 6) return state.customExercises['Okay']
    if (mood === 'Okay' && totalPain >= 8) return state.customExercises['Flare']
    return state.customExercises[mood]
  }, [state.mood, state.pain, state.customExercises])

  function setMood(mood) {
    setState(s => ({ ...s, mood }))
  }
  function setPain(key, val) {
    setState(s => ({ ...s, pain: { ...s.pain, [key]: val } }))
  }
  function toggleTaskDone(id) {
    setState(s => {
      const dayKey = `${s.weekNumber}-${dayIndex}`
      const done = s.doneMap?.[dayKey]?.[id]
      return {
        ...s,
        doneMap: {
          ...(s.doneMap || {}),
          [dayKey]: { ...(s.doneMap?.[dayKey] || {}), [id]: !done },
        },
      }
    })
  }
  function markDayComplete() {
    setState(s => {
      const wk = [...(s.weeks[s.weekNumber] || currentWeek)]
      wk[dayIndex] = { ...wk[dayIndex], completed: true }
      return { ...s, weeks: { ...s.weeks, [s.weekNumber]: wk } }
    })
  }
  function nextDay() {
    setDayIndex(i => (i + 1) % 7)
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'recovery-sprint-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  function importData(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        setState(data)
      } catch {
        alert('Invalid JSON')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 className="h1">{state.planName}</h1>
          <div className="sub">
            Week {state.weekNumber} · {day?.title}
          </div>
        </div>
        <div className="flex">
          <button className="btn" onClick={() => setState(s => ({ ...s, weekNumber: Math.max(1, s.weekNumber - 1) }))}>Prev wk</button>
          <button className="btn primary" onClick={() => setState(s => ({ ...s, weekNumber: s.weekNumber + 1, weeks: { ...s.weeks, [s.weekNumber + 1]: s.weeks[s.weekNumber + 1] || defaultWeek() } }))}>Next wk</button>
          <label className="btn">
            Import<input style={{ display: 'none' }} type="file" accept="application/json" onChange={importData} />
          </label>
          <button className="btn" onClick={exportData}>Export</button>
        </div>
      </div>

      <div className="row">
        <div className="card">
          <h3>Today’s dial-in</h3>
          <div className="flex">
            {['Good', 'Okay', 'Flare'].map(m => (
              <button key={m} className={`btn ${state.mood === m ? 'primary' : ''}`} onClick={() => setMood(m)}>{m}</button>
            ))}
          </div>
          <div className="grid" style={{ marginTop: 10 }}>
            {Object.entries(state.pain).map(([k, v]) => (
              <div key={k} className={`item ${'active'}`}>
                <div style={{ textTransform: 'capitalize' }}>{k}</div>
                <select className="select" value={String(v)} onChange={e => setPain(k, Number(e.target.value))}>
                  {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Today’s do‑now stack</h3>
          <div className="grid">
            {prescription.map(ex => {
              const dayKey = `${state.weekNumber}-${dayIndex}`
              const done = state.doneMap?.[dayKey]?.[ex.id] || false
              return (
                <div key={ex.id} className={`item ${done ? 'done' : ''}`}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{ex.name}</div>
                    <div className="sub" style={{ fontSize: 12 }}>{ex.area}</div>
                  </div>
                  <button className={`btn small ${done ? 'primary' : ''}`} onClick={() => toggleTaskDone(ex.id)}>
                    {done ? 'Done' : 'Mark done'}
                  </button>
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

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Week at a glance</h3>
        <div className="grid week">
          {currentWeek.map((d, i) => (
            <button key={i} className={`item ${i === dayIndex ? 'active' : ''}`} onClick={() => setDayIndex(i)}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{d.title}</div>
                <div className="sub" style={{ fontSize: 12 }}>{d.notes || 'No notes yet'}</div>
              </div>
              {d.completed ? <span className="badge">✓</span> : <span className="badge">•</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Customise your stacks</h3>
        {['Good','Okay','Flare'].map(mood => (
          <div key={mood} style={{ marginBottom: 16 }}>
            <div className="sub" style={{ marginBottom: 8 }}>{mood} day</div>
            {state.customExercises[mood].map((ex, idx) => (
              <div key={ex.id} className="item">
                <input className="select" style={{ flex: 1 }} value={ex.name} onChange={e => {
                  setState(s => {
                    const list = [...s.customExercises[mood]]
                    list[idx] = { ...list[idx], name: e.target.value }
                    return { ...s, customExercises: { ...s.customExercises, [mood]: list } }
                  })
                }} />
                <input className="select" style={{ width: 180 }} value={ex.area} onChange={e => {
                  setState(s => {
                    const list = [...s.customExercises[mood]]
                    list[idx] = { ...list[idx], area: e.target.value }
                    return { ...s, customExercises: { ...s.customExercises, [mood]: list } }
                  })
                }} />
                <button className="btn" onClick={() => {
                  setState(s => {
                    const list = s.customExercises[mood].filter((_, j) => j !== idx)
                    return { ...s, customExercises: { ...s.customExercises, [mood]: list } }
                  })
                }}>Remove</button>
              </div>
            ))}
            <button className="btn" onClick={() => {
              setState(s => {
                const list = [...s.customExercises[mood], { id: `${mood.toLowerCase()}-${Date.now()}`, name: 'New item', area: '' }]
                return { ...s, customExercises: { ...s.customExercises, [mood]: list } }
              })
            }}>Add item</button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Notes for today</h3>
        <textarea value={day?.notes || ''} placeholder="How did it feel? Any swaps? Any wins?"
          onChange={e => {
            setState(s => {
              const wk = [...(s.weeks[s.weekNumber] || currentWeek)]
              wk[dayIndex] = { ...wk[dayIndex], notes: e.target.value }
              return { ...s, weeks: { ...s.weeks, [s.weekNumber]: wk } }
            })
          }}/>
      </div>

      <div className="footer">Built for Louise · One small, smart session at a time.</div>
    </div>
  )
}
