import { useState, useEffect } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'
import { Modal, Sel, Textarea, ModalActions, Err, Btn } from './Routers'

export default function Vouchers() {
  const [batches,  setBatches]  = useState([])
  const [routers,  setRouters]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState({ router_id:'', package_id:'', codes:'' })
  const [packages, setPackages] = useState([])
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [result,   setResult]   = useState(null)

  useEffect(() => {
    Promise.all([api.get('/hotspot/routers/'), api.get('/vouchers/batches/')])
      .then(([r, b]) => { setRouters(r.data); setBatches(b.data) })
      .finally(() => setLoading(false))
  }, [])

  async function onRouter(e) {
    const id = e.target.value
    setForm(f => ({...f, router_id: id, package_id:''}))
    if (id) {
      const r = await api.get(`/hotspot/routers/${id}/packages/`)
      setPackages(r.data)
    }
  }

  async function submit(e) {
    e.preventDefault(); setSaving(true); setError(''); setResult(null)
    const codes = form.codes.split(/[\n,\s]+/).map(c => c.trim().toUpperCase()).filter(Boolean)
    try {
      const r = await api.post('/vouchers/batches/', { ...form, codes })
      setResult(r.data)
      const b = await api.get('/vouchers/batches/')
      setBatches(b.data)
      setForm({ router_id:'', package_id:'', codes:'' })
    } catch (err) { setError(JSON.stringify(err.response?.data || 'Upload failed')) }
    finally { setSaving(false) }
  }

  const codeCount = form.codes.split(/[\n,\s]+/).filter(Boolean).length

  return (
    <Layout title="Vouchers" action={<Btn onClick={() => { setModal(true); setError(''); setResult(null) }}>+ Upload Vouchers</Btn>}>
      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : batches.length === 0 ? (
        <div style={s.emptyState}>
          <div style={{ fontSize:32, marginBottom:10 }}>🎟️</div>
          <div style={{ fontWeight:600, marginBottom:4 }}>No vouchers uploaded yet</div>
          <div>Generate codes on MikroTik, then upload them here to start selling.</div>
        </div>
      ) : (
        <div style={s.list}>
          {batches.map(b => {
            const pct = b.count > 0 ? Math.round((b.sold + b.used) / b.count * 100) : 0
            return (
              <div key={b.id} style={s.card}>
                <div style={s.cardHead}>
                  <div>
                    <div style={s.cardTitle}>{b.package_name}</div>
                    <div style={s.cardSub}>{b.router_name} · {new Date(b.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</div>
                  </div>
                  <div style={s.counts}>
                    <Pill color="#15803D" bg="#DCFCE7">{b.available} left</Pill>
                    <Pill color="#92400E" bg="#FEF3C7">{b.sold} sold</Pill>
                    {b.used > 0 && <Pill color="#6B7280" bg="#F3F4F6">{b.used} used</Pill>}
                  </div>
                </div>
                <div style={s.barTrack}>
                  <div style={{...s.barFill, width:`${pct}%`}} />
                </div>
                <div style={s.barLabel}>{pct}% sold · {b.count} total</div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <Modal title="Upload Voucher Codes" onClose={() => setModal(false)}>
          {error  && <Err>{error}</Err>}
          {result && (
            <div style={s.successBox}>
              ✓ {result.uploaded} codes uploaded
              {result.skipped > 0 && ` · ${result.skipped} duplicates skipped`}
            </div>
          )}
          <form onSubmit={submit}>
            <Sel label="Router" value={form.router_id} onChange={onRouter} required>
              <option value="">Select router…</option>
              {routers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Sel>
            <Sel label="Package" value={form.package_id} onChange={e => setForm(f => ({...f, package_id: e.target.value}))} required disabled={!form.router_id}>
              <option value="">Select package…</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.name} — GHS {p.price_ghs}</option>)}
            </Sel>
            <Textarea
              label={`Voucher codes ${codeCount > 0 ? `(${codeCount} detected)` : ''}`}
              placeholder={'ABCD1234\nEFGH5678\nIJKL9012\n…'}
              value={form.codes}
              onChange={e => setForm(f => ({...f, codes: e.target.value}))}
              required
            />
            <div style={s.hint}>One code per line, or comma-separated. Codes will be converted to uppercase.</div>
            <ModalActions onCancel={() => setModal(false)} loading={saving} label="Upload" />
          </form>
        </Modal>
      )}
    </Layout>
  )
}

function Pill({ color, bg, children }) {
  return <span style={{ fontSize:11, fontWeight:600, color, background:bg, padding:'3px 9px', borderRadius:20 }}>{children}</span>
}

const s = {
  empty:      { padding:'40px 0', textAlign:'center', color:'#9CA3AF', fontSize:13 },
  emptyState: { textAlign:'center', padding:'60px 0', color:'#9CA3AF', fontSize:13, lineHeight:1.8 },
  list:       { display:'flex', flexDirection:'column', gap:10 },
  card:       { background:'#fff', borderRadius:10, border:'1px solid #E8E5DE', padding:'18px 20px' },
  cardHead:   { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, gap:12 },
  cardTitle:  { fontSize:15, fontWeight:700, color:'#1C2B45', marginBottom:3 },
  cardSub:    { fontSize:12, color:'#9CA3AF' },
  counts:     { display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' },
  barTrack:   { background:'#F0EEE8', borderRadius:4, height:6, overflow:'hidden', marginBottom:6 },
  barFill:    { height:'100%', background:'#BF7E08', borderRadius:4, transition:'width .4s ease' },
  barLabel:   { fontSize:11, color:'#9CA3AF' },
  successBox: { background:'#DCFCE7', border:'1px solid #BBF7D0', color:'#15803D', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 },
  hint:       { fontSize:11, color:'#9CA3AF', marginTop:-10, marginBottom:16, lineHeight:1.5 },
}
