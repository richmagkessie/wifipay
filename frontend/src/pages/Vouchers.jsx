import { useState, useEffect } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'

export default function Vouchers() {
  const [routers,   setRouters]   = useState([])
  const [batches,   setBatches]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState({ router_id:'', package_id:'', codes:'' })
  const [packages,  setPackages]  = useState([])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/hotspot/routers/'),
      api.get('/vouchers/batches/'),
    ]).then(([r, b]) => {
      setRouters(r.data)
      setBatches(b.data)
    }).finally(() => setLoading(false))
  }, [])

  async function onRouterChange(e) {
    const id = e.target.value
    setForm(f => ({...f, router_id: id, package_id:''}))
    if (id) {
      const r = await api.get(`/hotspot/routers/${id}/packages/`)
      setPackages(r.data)
    } else {
      setPackages([])
    }
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const codes = form.codes.split(/[\n,\s]+/).map(c => c.trim().toUpperCase()).filter(Boolean)
    if (codes.length === 0) { setError('No codes found'); setSaving(false); return }
    try {
      await api.post('/vouchers/batches/', {
        router_id:  form.router_id,
        package_id: form.package_id,
        codes,
      })
      setShowForm(false)
      const b = await api.get('/vouchers/batches/')
      setBatches(b.data)
    } catch (err) {
      setError(JSON.stringify(err.response?.data || 'Upload failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout title="Voucher Batches" action={<button style={styles.btn} onClick={() => { setShowForm(true); setError('') }}>+ Upload Vouchers</button>}>
      {loading && <div style={styles.hint}>Loading…</div>}

      {!loading && batches.length === 0 && (
        <div style={styles.empty}>
          No vouchers uploaded yet.<br />Generate codes on MikroTik, then upload them here.
        </div>
      )}

      <div style={styles.list}>
        {batches.map(b => (
          <div key={b.id} style={styles.card}>
            <div style={styles.cardTop}>
              <div>
                <div style={styles.cardName}>{b.package_name} — {b.router_name}</div>
                <div style={styles.cardSub}>Uploaded {new Date(b.created_at).toLocaleDateString()}</div>
              </div>
              <div style={styles.counts}>
                <span style={styles.countAvail}>{b.available} available</span>
                <span style={styles.countSold}>{b.sold} sold</span>
                <span style={styles.countUsed}>{b.used} used</span>
              </div>
            </div>
            <div style={styles.barWrap}>
              <div style={{...styles.bar, width: b.count > 0 ? `${(b.sold + b.used) / b.count * 100}%` : '0%'}} />
            </div>
            <div style={styles.total}>{b.count} total</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>Upload Voucher Codes</div>
            <div style={styles.modalHint}>
              Paste the codes you generated on MikroTik. One per line, or comma-separated.
            </div>
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={submit}>
              <label style={styles.label}>Router</label>
              <select style={styles.input} value={form.router_id} onChange={onRouterChange} required>
                <option value="">Select router…</option>
                {routers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>

              <label style={styles.label}>Package</label>
              <select style={styles.input} value={form.package_id} onChange={e => setForm(f => ({...f, package_id: e.target.value}))} required disabled={!form.router_id}>
                <option value="">Select package…</option>
                {packages.map(p => <option key={p.id} value={p.id}>{p.name} — GHS {p.price_ghs}</option>)}
              </select>

              <label style={styles.label}>Voucher Codes</label>
              <textarea
                style={{...styles.input, height:140, resize:'vertical', fontFamily:'monospace', fontSize:12}}
                placeholder={'ABCD1234\nEFGH5678\nIJKL9012\n…'}
                value={form.codes}
                onChange={e => setForm(f => ({...f, codes: e.target.value}))}
                required
              />
              <div style={styles.hint}>{form.codes.split(/[\n,\s]+/).filter(Boolean).length} codes detected</div>

              <div style={styles.btnRow}>
                <button style={styles.btn} type="submit" disabled={saving}>{saving ? 'Uploading…' : 'Upload'}</button>
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
  hint:        { fontSize:13, color:'#8C9BAD', padding:'4px 0' },
  empty:       { textAlign:'center', color:'#8C9BAD', fontSize:14, lineHeight:1.8, padding:'40px 0' },
  list:        { display:'flex', flexDirection:'column', gap:12 },
  card:        { background:'#fff', borderRadius:8, padding:'16px 18px', boxShadow:'0 1px 4px rgba(28,43,69,.07)' },
  cardTop:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, gap:12 },
  cardName:    { fontSize:14, fontWeight:700, color:'#1C2B45', marginBottom:2 },
  cardSub:     { fontSize:11, color:'#A8B4BE' },
  counts:      { display:'flex', gap:8, flexShrink:0 },
  countAvail:  { fontSize:11, fontWeight:700, color:'#2D7A4F', background:'#E8F5EE', padding:'3px 8px', borderRadius:20 },
  countSold:   { fontSize:11, fontWeight:700, color:'#BF7E08', background:'#FFF8E6', padding:'3px 8px', borderRadius:20 },
  countUsed:   { fontSize:11, fontWeight:700, color:'#8C9BAD', background:'#F0EFE9', padding:'3px 8px', borderRadius:20 },
  barWrap:     { background:'#F0EFE9', borderRadius:4, height:6, overflow:'hidden', marginBottom:6 },
  bar:         { height:'100%', background:'#BF7E08', borderRadius:4, transition:'width .3s' },
  total:       { fontSize:11, color:'#A8B4BE' },
  btn:         { padding:'10px 20px', background:'#1C2B45', color:'#fff', border:'none', borderRadius:7, fontWeight:700, fontSize:13, cursor:'pointer' },
  btnGhost:    { padding:'10px 20px', background:'transparent', border:'1.5px solid #D8DDEA', borderRadius:7, color:'#8C9BAD', fontSize:13, fontWeight:600, cursor:'pointer' },
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, zIndex:100 },
  modal:       { background:'#fff', borderRadius:10, padding:'24px 20px', width:'100%', maxWidth:420, maxHeight:'90vh', overflowY:'auto' },
  modalTitle:  { fontSize:16, fontWeight:700, color:'#1C2B45', marginBottom:6 },
  modalHint:   { fontSize:12, color:'#8C9BAD', marginBottom:16, lineHeight:1.5 },
  error:       { fontSize:12, color:'#A02828', background:'#FEF2F2', borderLeft:'3px solid #CB3030', padding:'8px 12px', borderRadius:'0 5px 5px 0', marginBottom:14 },
  label:       { display:'block', fontSize:11, fontWeight:700, color:'#8C9BAD', textTransform:'uppercase', letterSpacing:.8, marginBottom:4 },
  input:       { display:'block', width:'100%', padding:'11px 13px', border:'1.5px solid #D8DDEA', borderRadius:7, fontSize:14, color:'#1C2B45', outline:'none', marginBottom:12, boxSizing:'border-box' },
  btnRow:      { display:'flex', gap:10, marginTop:4 },
}
