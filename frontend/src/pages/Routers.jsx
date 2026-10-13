import { useState, useEffect } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'

const blank = { name:'', location:'', router_ip:'', api_port:8728, ssh_user:'admin', ssh_password:'', is_active:true }

export default function Routers() {
  const [routers,  setRouters]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null) // null | 'add' | router-object
  const [form,     setForm]     = useState(blank)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => { fetch() }, [])

  async function fetch() {
    const r = await api.get('/hotspot/routers/')
    setRouters(r.data)
    setLoading(false)
  }

  function openAdd()   { setForm(blank); setModal('add'); setError('') }
  function openEdit(r) { setForm(r);     setModal(r);    setError('') }

  function set(k) { return e => setForm(f => ({...f, [k]: e.target.value})) }

  async function save(e) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      modal === 'add'
        ? await api.post('/hotspot/routers/', form)
        : await api.patch(`/hotspot/routers/${modal.id}/`, form)
      setModal(null); fetch()
    } catch (err) { setError(JSON.stringify(err.response?.data || 'Save failed')) }
    finally { setSaving(false) }
  }

  async function remove(id) {
    if (!window.confirm('Delete this router and all its data?')) return
    await api.delete(`/hotspot/routers/${id}/`)
    fetch()
  }

  return (
    <Layout title="Routers" action={<Btn onClick={openAdd}>+ Add Router</Btn>}>
      {loading ? (
        <Empty icon="📡" text="Loading…" />
      ) : routers.length === 0 ? (
        <Empty icon="📡" text="No routers yet. Add your MikroTik to start." />
      ) : (
        <div style={s.grid}>
          {routers.map(r => (
            <div key={r.id} style={s.card}>
              <div style={s.cardTop}>
                <div style={s.dot(r.is_active)} />
                <div style={s.cardName}>{r.name}</div>
                <span style={s.ip}>{r.router_ip}</span>
              </div>
              {r.location && <div style={s.loc}>{r.location}</div>}
              <div style={s.pkgs}>
                {r.packages?.length > 0
                  ? r.packages.map(p => <span key={p.id} style={s.pkg}>{p.name}</span>)
                  : <span style={s.noPkgs}>No packages</span>}
              </div>
              <div style={s.actions}>
                <TextBtn onClick={() => openEdit(r)}>Edit</TextBtn>
                <TextBtn onClick={() => window.location.href=`/routers/${r.id}/packages`}>Packages</TextBtn>
                <TextBtn danger onClick={() => remove(r.id)}>Delete</TextBtn>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Router' : 'Edit Router'} onClose={() => setModal(null)}>
          {error && <Err>{error}</Err>}
          <form onSubmit={save}>
            <F label="Router name" placeholder="e.g. BELORA Connect" value={form.name} onChange={set('name')} required />
            <F label="Location" placeholder="e.g. Agyegyamkono" value={form.location} onChange={set('location')} />
            <F label="Router IP" placeholder="192.168.88.1" value={form.router_ip} onChange={set('router_ip')} required />
            <div style={{display:'flex',gap:10}}>
              <div style={{flex:1}}><F label="SSH User" value={form.ssh_user} onChange={set('ssh_user')} required /></div>
              <div style={{flex:1}}><F label="SSH Password" type="password" placeholder="••••••" value={form.ssh_password} onChange={set('ssh_password')} /></div>
            </div>
            <Check label="Active" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} />
            <ModalActions onCancel={() => setModal(null)} loading={saving} />
          </form>
        </Modal>
      )}
    </Layout>
  )
}

// ─── shared UI atoms ──────────────────────────────────────────────────────────
export function Modal({ title, onClose, children }) {
  return (
    <div style={m.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={m.box}>
        <div style={m.head}>
          <div style={m.title}>{title}</div>
          <button style={m.close} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function F({ label, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={m.label}>{label}</label>
      <input style={m.input} {...props} />
    </div>
  )
}

export function Sel({ label, children, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={m.label}>{label}</label>
      <select style={m.input} {...props}>{children}</select>
    </div>
  )
}

export function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={m.label}>{label}</label>
      <textarea style={{...m.input, height:130, resize:'vertical', fontFamily:'monospace', fontSize:12}} {...props} />
    </div>
  )
}

export function Check({ label, ...props }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
      <input type="checkbox" id={label} {...props} style={{ width:15, height:15, cursor:'pointer' }} />
      <label htmlFor={label} style={{ fontSize:13, color:'#1C2B45', cursor:'pointer' }}>{label}</label>
    </div>
  )
}

export function ModalActions({ onCancel, loading, label='Save' }) {
  return (
    <div style={{ display:'flex', gap:10, marginTop:4 }}>
      <button style={m.btn} type="submit" disabled={loading}>{loading ? 'Saving…' : label}</button>
      <button style={m.btnGhost} type="button" onClick={onCancel}>Cancel</button>
    </div>
  )
}

export function Err({ children }) {
  return <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{children}</div>
}

export function Btn({ children, ...props }) {
  return <button style={btn.primary} {...props}>{children}</button>
}

export function TextBtn({ children, danger, ...props }) {
  return <button style={{ ...btn.text, ...(danger ? btn.danger : {}) }} {...props}>{children}</button>
}

function Empty({ icon, text }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 0', color:'#9CA3AF' }}>
      <div style={{ fontSize:32, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:13 }}>{text}</div>
    </div>
  )
}

const s = {
  grid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 },
  card:    { background:'#fff', borderRadius:10, border:'1px solid #E8E5DE', padding:'18px 20px' },
  cardTop: { display:'flex', alignItems:'center', gap:8, marginBottom:6 },
  cardName:{ fontSize:15, fontWeight:700, color:'#1C2B45', flex:1 },
  dot:     active => ({ width:8, height:8, borderRadius:'50%', background: active ? '#16A34A' : '#D1D5DB', flexShrink:0 }),
  ip:      { fontSize:11, fontWeight:600, background:'#F4F3EF', color:'#6B7280', padding:'3px 8px', borderRadius:6 },
  loc:     { fontSize:12, color:'#9CA3AF', marginBottom:10 },
  pkgs:    { display:'flex', flexWrap:'wrap', gap:6, marginBottom:14, minHeight:24 },
  pkg:     { fontSize:11, fontWeight:600, background:'#EEF2FF', color:'#4338CA', padding:'3px 9px', borderRadius:20 },
  noPkgs:  { fontSize:11, color:'#D1D5DB' },
  actions: { display:'flex', gap:16, borderTop:'1px solid #F0EEE8', paddingTop:12 },
}

const btn = {
  primary:  { padding:'9px 18px', background:'#1C2B45', color:'#fff', border:'none', borderRadius:7, fontWeight:700, fontSize:13, cursor:'pointer' },
  text:     { background:'none', border:'none', fontSize:13, fontWeight:600, color:'#1C2B45', cursor:'pointer', padding:0 },
  danger:   { color:'#DC2626' },
}

const m = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, zIndex:200 },
  box:     { background:'#fff', borderRadius:12, padding:'24px', width:'100%', maxWidth:420, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.15)' },
  head:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  title:   { fontSize:17, fontWeight:700, color:'#1C2B45' },
  close:   { background:'none', border:'none', fontSize:16, color:'#9CA3AF', cursor:'pointer' },
  label:   { display:'block', fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:6 },
  input:   { display:'block', width:'100%', padding:'11px 14px', border:'1.5px solid #E5E3DC', borderRadius:8, fontSize:14, color:'#1C2B45', outline:'none', marginBottom:0, boxSizing:'border-box', background:'#fff' },
  btn:     { padding:'11px 22px', background:'#1C2B45', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer' },
  btnGhost:{ padding:'11px 22px', background:'#fff', border:'1.5px solid #E5E3DC', borderRadius:8, color:'#6B7280', fontWeight:600, fontSize:13, cursor:'pointer' },
}
