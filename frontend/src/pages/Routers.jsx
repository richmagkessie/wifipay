import { useState, useEffect } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'

export default function Routers() {
  const [routers,    setRouters]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [error,      setError]      = useState('')

  const blank = { name:'', location:'', router_ip:'', api_port:8728, ssh_user:'admin', ssh_password:'', is_active:true }
  const [form, setForm] = useState(blank)

  useEffect(() => { fetchRouters() }, [])

  async function fetchRouters() {
    try {
      const r = await api.get('/hotspot/routers/')
      setRouters(r.data)
    } finally { setLoading(false) }
  }

  function set(k) { return e => setForm(f => ({...f, [k]: e.target.value})) }

  function openAdd()    { setForm(blank); setEditing(null); setShowForm(true); setError('') }
  function openEdit(r)  { setForm(r);     setEditing(r.id); setShowForm(true); setError('') }

  async function save(e) {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await api.patch(`/hotspot/routers/${editing}/`, form)
      } else {
        await api.post('/hotspot/routers/', form)
      }
      setShowForm(false)
      fetchRouters()
    } catch (err) {
      setError(JSON.stringify(err.response?.data || 'Save failed'))
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this router?')) return
    await api.delete(`/hotspot/routers/${id}/`)
    fetchRouters()
  }

  return (
    <Layout title="Routers" action={<button style={styles.btn} onClick={openAdd}>+ Add Router</button>}>
      {loading && <div style={styles.hint}>Loading…</div>}

      {!loading && routers.length === 0 && (
        <div style={styles.empty}>
          No routers yet.<br />Add your MikroTik to start selling vouchers.
        </div>
      )}

      <div style={styles.list}>
        {routers.map(r => (
          <div key={r.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardName}>{r.name}</div>
                <div style={styles.cardSub}>{r.location} · {r.router_ip}</div>
              </div>
              <span style={{...styles.badge, ...(r.is_active ? styles.badgeOn : styles.badgeOff)}}>
                {r.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div style={styles.pkgRow}>
              {r.packages?.length > 0
                ? r.packages.map(p => (
                    <span key={p.id} style={styles.pkg}>{p.name} · GHS {p.price_ghs}</span>
                  ))
                : <span style={styles.hint}>No packages — add from Packages tab</span>
              }
            </div>
            <div style={styles.cardActions}>
              <button style={styles.linkBtn} onClick={() => openEdit(r)}>Edit</button>
              <button style={styles.linkBtn} onClick={() => window.location.href=`/routers/${r.id}/packages`}>Packages</button>
              <button style={{...styles.linkBtn, color:'#CB3030'}} onClick={() => remove(r.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>{editing ? 'Edit Router' : 'Add Router'}</div>
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={save}>
              <label style={styles.label}>Name</label>
              <input style={styles.input} placeholder="e.g. BELORA Connect" value={form.name} onChange={set('name')} required />

              <label style={styles.label}>Location</label>
              <input style={styles.input} placeholder="e.g. Agyegyamkono" value={form.location} onChange={set('location')} />

              <label style={styles.label}>Router IP</label>
              <input style={styles.input} placeholder="192.168.88.1" value={form.router_ip} onChange={set('router_ip')} required />

              <div style={styles.row}>
                <div style={{flex:1}}>
                  <label style={styles.label}>SSH User</label>
                  <input style={styles.input} value={form.ssh_user} onChange={set('ssh_user')} required />
                </div>
                <div style={{flex:1}}>
                  <label style={styles.label}>SSH Password</label>
                  <input style={styles.input} type="password" placeholder="••••••••" value={form.ssh_password} onChange={set('ssh_password')} />
                </div>
              </div>

              <div style={styles.checkRow}>
                <input type="checkbox" id="active" checked={form.is_active}
                  onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} />
                <label htmlFor="active" style={{fontSize:13, color:'#1C2B45'}}>Active</label>
              </div>

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
  hint:       { fontSize:13, color:'#8C9BAD', padding:'8px 0' },
  empty:      { textAlign:'center', color:'#8C9BAD', fontSize:14, lineHeight:1.8, padding:'40px 0' },
  list:       { display:'flex', flexDirection:'column', gap:12 },
  card:       { background:'#fff', borderRadius:8, padding:'16px 18px', boxShadow:'0 1px 4px rgba(28,43,69,.07)' },
  cardHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 },
  cardName:   { fontSize:15, fontWeight:700, color:'#1C2B45' },
  cardSub:    { fontSize:12, color:'#8C9BAD', marginTop:2 },
  pkgRow:     { display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 },
  pkg:        { fontSize:11, background:'#F0EFE9', color:'#1C2B45', padding:'4px 10px', borderRadius:20, fontWeight:600 },
  cardActions:{ display:'flex', gap:16, borderTop:'1px solid #F5F4F0', paddingTop:10 },
  badge:      { fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, letterSpacing:.5 },
  badgeOn:    { background:'#E8F5EE', color:'#2D7A4F' },
  badgeOff:   { background:'#FEF2F2', color:'#CB3030' },
  linkBtn:    { background:'none', border:'none', fontSize:13, fontWeight:600, color:'#1C2B45', cursor:'pointer', padding:0 },
  btn:        { padding:'10px 20px', background:'#1C2B45', color:'#fff', border:'none', borderRadius:7, fontWeight:700, fontSize:13, cursor:'pointer' },
  btnGhost:   { padding:'10px 20px', background:'transparent', border:'1.5px solid #D8DDEA', borderRadius:7, color:'#8C9BAD', fontSize:13, fontWeight:600, cursor:'pointer' },
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, zIndex:100 },
  modal:      { background:'#fff', borderRadius:10, padding:'24px 20px', width:'100%', maxWidth:420, maxHeight:'90vh', overflowY:'auto' },
  modalTitle: { fontSize:16, fontWeight:700, color:'#1C2B45', marginBottom:16 },
  error:      { fontSize:12, color:'#A02828', background:'#FEF2F2', borderLeft:'3px solid #CB3030', padding:'8px 12px', borderRadius:'0 5px 5px 0', marginBottom:14 },
  label:      { display:'block', fontSize:11, fontWeight:700, color:'#8C9BAD', textTransform:'uppercase', letterSpacing:.8, marginBottom:4 },
  input:      { display:'block', width:'100%', padding:'11px 13px', border:'1.5px solid #D8DDEA', borderRadius:7, fontSize:14, color:'#1C2B45', outline:'none', marginBottom:12, boxSizing:'border-box' },
  row:        { display:'flex', gap:10 },
  checkRow:   { display:'flex', alignItems:'center', gap:8, marginBottom:16 },
  btnRow:     { display:'flex', gap:10 },
}
