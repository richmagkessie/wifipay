import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'
import Layout from '../components/Layout'

const DURATIONS = ['1hr','3hr','daily','weekly','custom']

export default function Packages() {
  const { routerId }  = useParams()
  const [router,    setRouter]    = useState(null)
  const [packages,  setPackages]  = useState([])
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [error,     setError]     = useState('')

  const blank = { name:'', duration:'daily', price_ghs:'', speed_mbps:10, mikrotik_profile:'', is_active:true }
  const [form, setForm] = useState(blank)

  useEffect(() => {
    api.get(`/hotspot/routers/${routerId}/`).then(r => setRouter(r.data))
    fetchPackages()
  }, [routerId])

  async function fetchPackages() {
    const r = await api.get(`/hotspot/routers/${routerId}/packages/`)
    setPackages(r.data)
  }

  function set(k) { return e => setForm(f => ({...f, [k]: e.target.value})) }
  function openAdd()   { setForm(blank); setEditing(null); setShowForm(true); setError('') }
  function openEdit(p) { setForm(p);     setEditing(p.id); setShowForm(true); setError('') }

  async function save(e) {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await api.patch(`/hotspot/routers/${routerId}/packages/${editing}/`, form)
      } else {
        await api.post(`/hotspot/routers/${routerId}/packages/`, form)
      }
      setShowForm(false)
      fetchPackages()
    } catch (err) {
      setError(JSON.stringify(err.response?.data || 'Save failed'))
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this package?')) return
    await api.delete(`/hotspot/routers/${routerId}/packages/${id}/`)
    fetchPackages()
  }

  return (
    <Layout
      title={router ? `Packages — ${router.name}` : 'Packages'}
      back="/routers"
      action={<button style={styles.btn} onClick={openAdd}>+ Add Package</button>}
    >
      {packages.length === 0 && (
        <div style={styles.empty}>No packages yet. Add a package to start selling.</div>
      )}

      <div style={styles.grid}>
        {packages.map(p => (
          <div key={p.id} style={styles.card}>
            <div style={styles.duration}>{p.duration}</div>
            <div style={styles.name}>{p.name}</div>
            <div style={styles.price}>GHS {p.price_ghs}</div>
            <div style={styles.meta}>{p.speed_mbps} Mbps · profile: {p.mikrotik_profile}</div>
            <div style={styles.cardActions}>
              <button style={styles.linkBtn} onClick={() => openEdit(p)}>Edit</button>
              <button style={{...styles.linkBtn, color:'#CB3030'}} onClick={() => remove(p.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>{editing ? 'Edit Package' : 'Add Package'}</div>
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={save}>
              <label style={styles.label}>Package Name</label>
              <input style={styles.input} placeholder="e.g. Daily" value={form.name} onChange={set('name')} required />

              <label style={styles.label}>Duration</label>
              <select style={styles.input} value={form.duration} onChange={set('duration')}>
                {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <div style={styles.row}>
                <div style={{flex:1}}>
                  <label style={styles.label}>Price (GHS)</label>
                  <input style={styles.input} type="number" step="0.01" min="0" value={form.price_ghs} onChange={set('price_ghs')} required />
                </div>
                <div style={{flex:1}}>
                  <label style={styles.label}>Speed (Mbps)</label>
                  <input style={styles.input} type="number" min="1" value={form.speed_mbps} onChange={set('speed_mbps')} required />
                </div>
              </div>

              <label style={styles.label}>MikroTik Profile Name</label>
              <input style={styles.input} placeholder="e.g. daily" value={form.mikrotik_profile} onChange={set('mikrotik_profile')} required />
              <div style={styles.hint}>Must match exactly the profile name on your MikroTik hotspot server.</div>

              <div style={styles.btnRow}>
                <button style={styles.btn} type="submit">Save</button>
                <button style={styles.btnGhost} type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

const styles = {
  empty:      { textAlign:'center', color:'#8C9BAD', fontSize:14, padding:'40px 0' },
  grid:       { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 },
  card:       { background:'#fff', borderRadius:8, padding:'16px', boxShadow:'0 1px 4px rgba(28,43,69,.07)' },
  duration:   { fontSize:10, fontWeight:700, color:'#BF7E08', textTransform:'uppercase', letterSpacing:1, marginBottom:4 },
  name:       { fontSize:15, fontWeight:700, color:'#1C2B45', marginBottom:4 },
  price:      { fontSize:22, fontWeight:800, color:'#1C2B45', marginBottom:4 },
  meta:       { fontSize:11, color:'#8C9BAD', marginBottom:12 },
  cardActions:{ display:'flex', gap:16, borderTop:'1px solid #F5F4F0', paddingTop:10 },
  linkBtn:    { background:'none', border:'none', fontSize:13, fontWeight:600, color:'#1C2B45', cursor:'pointer', padding:0 },
  btn:        { padding:'10px 20px', background:'#1C2B45', color:'#fff', border:'none', borderRadius:7, fontWeight:700, fontSize:13, cursor:'pointer' },
  btnGhost:   { padding:'10px 20px', background:'transparent', border:'1.5px solid #D8DDEA', borderRadius:7, color:'#8C9BAD', fontSize:13, fontWeight:600, cursor:'pointer' },
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, zIndex:100 },
  modal:      { background:'#fff', borderRadius:10, padding:'24px 20px', width:'100%', maxWidth:420, maxHeight:'90vh', overflowY:'auto' },
  modalTitle: { fontSize:16, fontWeight:700, color:'#1C2B45', marginBottom:16 },
  error:      { fontSize:12, color:'#A02828', background:'#FEF2F2', borderLeft:'3px solid #CB3030', padding:'8px 12px', borderRadius:'0 5px 5px 0', marginBottom:14 },
  hint:       { fontSize:11, color:'#A8B4BE', marginTop:-8, marginBottom:12 },
  label:      { display:'block', fontSize:11, fontWeight:700, color:'#8C9BAD', textTransform:'uppercase', letterSpacing:.8, marginBottom:4 },
  input:      { display:'block', width:'100%', padding:'11px 13px', border:'1.5px solid #D8DDEA', borderRadius:7, fontSize:14, color:'#1C2B45', outline:'none', marginBottom:12, boxSizing:'border-box' },
  row:        { display:'flex', gap:10 },
  btnRow:     { display:'flex', gap:10, marginTop:4 },
}
