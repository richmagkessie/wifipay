import { useState, useEffect, useRef } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'
import { Modal, Sel, ModalActions, Err, Btn } from './Routers'
import { parseVoucherFile } from '../utils/voucherParser'

export default function Vouchers() {
  const [batches,  setBatches]  = useState([])
  const [routers,  setRouters]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState({ router_id:'', package_id:'' })
  const [packages, setPackages] = useState([])
  const [codes,    setCodes]    = useState([])          // parsed codes array
  const [rawText,  setRawText]  = useState('')           // manual textarea
  const [mode,     setMode]     = useState('file')       // 'file' | 'paste'
  const [parsing,  setParsing]  = useState(false)
  const [fileInfo, setFileInfo] = useState(null)         // { name, type, count }
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [result,   setResult]   = useState(null)
  const fileRef = useRef()

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

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true); setError(''); setCodes([])
    try {
      const parsed = await parseVoucherFile(file)
      if (parsed.length === 0) {
        setError('No valid voucher codes found in this file. Try pasting them manually.')
      } else {
        setCodes(parsed)
        setFileInfo({ name: file.name, count: parsed.length })
      }
    } catch (err) {
      setError(`Could not read file: ${err.message}`)
    } finally { setParsing(false) }
    e.target.value = ''
  }

  function onPasteChange(e) {
    const text = e.target.value
    setRawText(text)
    const parsed = text.trim().split(/[\n,\s]+/).map(c => c.trim().toUpperCase()).filter(c => /^[A-Z0-9]{6,20}$/.test(c) && /[0-9]/.test(c) && /[A-Z]/.test(c))
    setCodes([...new Set(parsed)])
  }

  function openModal() {
    setModal(true); setError(''); setResult(null)
    setForm({ router_id:'', package_id:'' })
    setCodes([]); setRawText(''); setFileInfo(null); setMode('file')
  }

  async function submit(e) {
    e.preventDefault()
    if (codes.length === 0) { setError('No codes to upload.'); return }
    setSaving(true); setError(''); setResult(null)
    try {
      const r = await api.post('/vouchers/batches/', { ...form, codes })
      setResult(r.data)
      const b = await api.get('/vouchers/batches/')
      setBatches(b.data)
      setCodes([]); setRawText(''); setFileInfo(null)
      setForm({ router_id:'', package_id:'' })
    } catch (err) { setError(JSON.stringify(err.response?.data || 'Upload failed')) }
    finally { setSaving(false) }
  }

  return (
    <Layout title="Vouchers" action={<Btn onClick={openModal}>+ Upload Vouchers</Btn>}>
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

            {/* Mode toggle */}
            <div style={s.modeRow}>
              <ModeBtn active={mode==='file'}  onClick={() => setMode('file')}>Upload file</ModeBtn>
              <ModeBtn active={mode==='paste'} onClick={() => setMode('paste')}>Paste codes</ModeBtn>
            </div>

            {mode === 'file' ? (
              <>
                {/* Drop zone */}
                <div
                  style={s.dropZone}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#BF7E08' }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = '#E5E3DC' }}
                  onDrop={async e => {
                    e.preventDefault()
                    e.currentTarget.style.borderColor = '#E5E3DC'
                    const file = e.dataTransfer.files?.[0]
                    if (file) await onFile({ target: { files:[file], value:'' } })
                  }}
                >
                  {parsing ? (
                    <div style={s.dzText}>Reading file…</div>
                  ) : fileInfo ? (
                    <>
                      <div style={s.dzFile}>📄 {fileInfo.name}</div>
                      <div style={s.dzCount}>{fileInfo.count} codes detected</div>
                      <div style={s.dzChange}>Click to change file</div>
                    </>
                  ) : (
                    <>
                      <div style={s.dzIcon}>⬆</div>
                      <div style={s.dzText}>Drop a file here or click to browse</div>
                      <div style={s.dzFormats}>Supports PDF, CSV, TXT — from MikroTik or WifiPay</div>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.csv,.txt,.log" style={{display:'none'}} onChange={onFile} />
              </>
            ) : (
              <>
                <div style={{ marginBottom:14 }}>
                  <label style={s.label}>Paste codes</label>
                  <textarea
                    style={s.textarea}
                    placeholder={'ABCD1234\nEFGH5678\n…  or  ABCD1234, EFGH5678, …'}
                    value={rawText}
                    onChange={onPasteChange}
                  />
                </div>
              </>
            )}

            {/* Code preview */}
            {codes.length > 0 && (
              <div style={s.preview}>
                <span style={s.previewCount}>{codes.length} codes ready</span>
                <span style={s.previewSample}>{codes.slice(0, 4).join(', ')}{codes.length > 4 ? ` +${codes.length - 4} more` : ''}</span>
              </div>
            )}

            <ModalActions onCancel={() => setModal(false)} loading={saving} label={`Upload ${codes.length > 0 ? codes.length + ' codes' : ''}`} />
          </form>
        </Modal>
      )}
    </Layout>
  )
}

function ModeBtn({ active, children, onClick }) {
  return (
    <button type="button" style={{...s.modeBtn, ...(active ? s.modeBtnActive : {})}} onClick={onClick}>
      {children}
    </button>
  )
}

function Pill({ color, bg, children }) {
  return <span style={{ fontSize:11, fontWeight:600, color, background:bg, padding:'3px 9px', borderRadius:20 }}>{children}</span>
}

const s = {
  empty:       { padding:'40px 0', textAlign:'center', color:'#9CA3AF', fontSize:13 },
  emptyState:  { textAlign:'center', padding:'60px 0', color:'#9CA3AF', fontSize:13, lineHeight:1.8 },
  list:        { display:'flex', flexDirection:'column', gap:10 },
  card:        { background:'#fff', borderRadius:10, border:'1px solid #E8E5DE', padding:'18px 20px' },
  cardHead:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, gap:12 },
  cardTitle:   { fontSize:15, fontWeight:700, color:'#1C2B45', marginBottom:3 },
  cardSub:     { fontSize:12, color:'#9CA3AF' },
  counts:      { display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' },
  barTrack:    { background:'#F0EEE8', borderRadius:4, height:6, overflow:'hidden', marginBottom:6 },
  barFill:     { height:'100%', background:'#BF7E08', borderRadius:4, transition:'width .4s ease' },
  barLabel:    { fontSize:11, color:'#9CA3AF' },
  successBox:  { background:'#DCFCE7', border:'1px solid #BBF7D0', color:'#15803D', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 },
  modeRow:     { display:'flex', gap:4, marginBottom:14, background:'#F4F3EF', borderRadius:8, padding:4 },
  modeBtn:     { flex:1, padding:'7px 12px', background:'transparent', border:'none', borderRadius:6, fontSize:13, fontWeight:600, color:'#9CA3AF', cursor:'pointer' },
  modeBtnActive:{ background:'#fff', color:'#1C2B45', boxShadow:'0 1px 3px rgba(0,0,0,.1)' },
  dropZone:    { border:'2px dashed #E5E3DC', borderRadius:10, padding:'28px 20px', textAlign:'center', cursor:'pointer', marginBottom:14, transition:'border-color .15s', background:'#FAFAF8' },
  dzIcon:      { fontSize:24, color:'#D1D5DB', marginBottom:8 },
  dzText:      { fontSize:13, fontWeight:600, color:'#6B7280', marginBottom:4 },
  dzFormats:   { fontSize:11, color:'#9CA3AF' },
  dzFile:      { fontSize:14, fontWeight:600, color:'#1C2B45', marginBottom:4 },
  dzCount:     { fontSize:22, fontWeight:800, color:'#15803D', marginBottom:4 },
  dzChange:    { fontSize:11, color:'#9CA3AF' },
  label:       { display:'block', fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:6 },
  textarea:    { display:'block', width:'100%', padding:'11px 14px', border:'1.5px solid #E5E3DC', borderRadius:8, fontSize:12, color:'#1C2B45', outline:'none', boxSizing:'border-box', fontFamily:'monospace', height:120, resize:'vertical', background:'#fff' },
  preview:     { background:'#F4F3EF', borderRadius:8, padding:'10px 14px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 },
  previewCount:{ fontSize:13, fontWeight:700, color:'#15803D' },
  previewSample:{ fontSize:11, color:'#9CA3AF', fontFamily:'monospace', textAlign:'right' },
}
