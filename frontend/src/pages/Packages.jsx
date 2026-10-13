import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'
import Layout from '../components/Layout'
import { Modal, F, Sel, Check, ModalActions, Err, Btn, TextBtn } from './Routers'

const DURATIONS = ['1hr','3hr','daily','weekly','custom']

export default function Packages() {
  const { routerId } = useParams()
  const [router,   setRouter]   = useState(null)
  const [packages, setPackages] = useState([])
  const [modal,    setModal]    = useState(null)
  const [form,     setForm]     = useState({ name:'', duration:'daily', price_ghs:'', speed_mbps:10, mikrotik_profile:'', is_active:true })
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    api.get(`/hotspot/routers/${routerId}/`).then(r => setRouter(r.data))
    fetch()
  }, [routerId])

  async function fetch() {
    const r = await api.get(`/hotspot/routers/${routerId}/packages/`)
    setPackages(r.data)
  }

  function set(k) { return e => setForm(f => ({...f, [k]: e.target.value})) }

  function openAdd()   { setForm({ name:'', duration:'daily', price_ghs:'', speed_mbps:10, mikrotik_profile:'', is_active:true }); setModal('add'); setError('') }
  function openEdit(p) { setForm(p); setModal(p); setError('') }

  async function save(e) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      modal === 'add'
        ? await api.post(`/hotspot/routers/${routerId}/packages/`, form)
        : await api.patch(`/hotspot/routers/${routerId}/packages/${modal.id}/`, form)
      setModal(null); fetch()
    } catch (err) { setError(JSON.stringify(err.response?.data || 'Save failed')) }
    finally { setSaving(false) }
  }

  async function remove(id) {
    if (!window.confirm('Delete this package?')) return
    await api.delete(`/hotspot/routers/${routerId}/packages/${id}/`)
    fetch()
  }

  const DURATION_LABEL = { '1hr':'1 Hour', '3hr':'3 Hours', daily:'Daily', weekly:'Weekly', custom:'Custom' }

  return (
    <Layout
      title={router ? `${router.name} — Packages` : 'Packages'}
      back="/routers"
      action={<Btn onClick={openAdd}>+ Add Package</Btn>}
    >
      {packages.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📦</div>
          <div>No packages yet. Add one to start selling.</div>
        </div>
      ) : (
        <div style={s.grid}>
          {packages.map(p => (
            <div key={p.id} style={s.card}>
              <div style={s.duration}>{DURATION_LABEL[p.duration] || p.duration}</div>
              <div style={s.name}>{p.name}</div>
              <div style={s.price}>GHS {p.price_ghs}</div>
              <div style={s.meta}>{p.speed_mbps} Mbps</div>
              <div style={s.profile}>Profile: <code style={s.code}>{p.mikrotik_profile}</code></div>
              <div style={s.actions}>
                <TextBtn onClick={() => openEdit(p)}>Edit</TextBtn>
                <TextBtn danger onClick={() => remove(p.id)}>Delete</TextBtn>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Package' : 'Edit Package'} onClose={() => setModal(null)}>
          {error && <Err>{error}</Err>}
          <form onSubmit={save}>
            <F label="Package name" placeholder="e.g. Daily" value={form.name} onChange={set('name')} required />
            <div style={{display:'flex',gap:10}}>
              <div style={{flex:1}}>
                <Sel label="Duration" value={form.duration} onChange={set('duration')}>
                  {DURATIONS.map(d => <option key={d} value={d}>{DURATION_LABEL[d]}</option>)}
                </Sel>
              </div>
              <div style={{flex:1}}>
                <F label="Price (GHS)" type="number" step="0.01" min="0" value={form.price_ghs} onChange={set('price_ghs')} required />
              </div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <div style={{flex:1}}>
                <F label="Speed (Mbps)" type="number" min="1" value={form.speed_mbps} onChange={set('speed_mbps')} required />
              </div>
              <div style={{flex:1}}>
                <F label="MikroTik profile" placeholder="e.g. daily" value={form.mikrotik_profile} onChange={set('mikrotik_profile')} required />
              </div>
            </div>
            <div style={{ fontSize:11, color:'#9CA3AF', marginTop:-10, marginBottom:14 }}>
              Must match exactly the profile name on your MikroTik hotspot server.
            </div>
            <Check label="Active" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} />
            <ModalActions onCancel={() => setModal(null)} loading={saving} />
          </form>
        </Modal>
      )}
    </Layout>
  )
}

const s = {
  empty:    { textAlign:'center', padding:'60px 0', color:'#9CA3AF', fontSize:13 },
  emptyIcon:{ fontSize:32, marginBottom:10 },
  grid:     { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 },
  card:     { background:'#fff', borderRadius:10, border:'1px solid #E8E5DE', padding:'18px 20px' },
  duration: { fontSize:10, fontWeight:700, color:'#BF7E08', textTransform:'uppercase', letterSpacing:1, marginBottom:6 },
  name:     { fontSize:15, fontWeight:700, color:'#1C2B45', marginBottom:6 },
  price:    { fontSize:26, fontWeight:800, color:'#1C2B45', letterSpacing:'-0.5px', marginBottom:4 },
  meta:     { fontSize:12, color:'#9CA3AF', marginBottom:8 },
  profile:  { fontSize:12, color:'#9CA3AF', marginBottom:14 },
  code:     { background:'#F4F3EF', color:'#4338CA', padding:'2px 6px', borderRadius:4, fontSize:11 },
  actions:  { display:'flex', gap:16, borderTop:'1px solid #F0EEE8', paddingTop:12 },
}
