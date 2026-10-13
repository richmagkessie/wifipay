import { useState, useEffect } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'

export default function Dashboard() {
  const [stats,     setStats]     = useState(null)
  const [wallet,    setWallet]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/payments/dashboard/stats/'),
      api.get('/wallet/'),
    ]).then(([s, w]) => { setStats(s.data); setWallet(w.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout title="Dashboard"><Skeleton /></Layout>

  const balance = Number(wallet?.balance || 0)

  return (
    <Layout title="Dashboard">
      {/* Wallet hero */}
      <div style={s.walletHero}>
        <div>
          <div style={s.heroLabel}>Available Balance</div>
          <div style={s.heroAmount}>GHS {balance.toFixed(2)}</div>
          <div style={s.heroSub}>
            GHS {Number(wallet?.total_earned || 0).toFixed(2)} earned total &nbsp;·&nbsp;
            GHS {Number(wallet?.total_withdrawn || 0).toFixed(2)} withdrawn
          </div>
        </div>
        <button style={s.withdrawBtn} onClick={() => setShowModal(true)}>
          Withdraw funds
        </button>
      </div>

      {/* KPI row */}
      <div style={s.kpiRow}>
        <KPI label="Today's Revenue"  value={`GHS ${Number(stats?.today_revenue || 0).toFixed(2)}`} accent />
        <KPI label="Today's Sales"    value={stats?.today_sales   || 0} />
        <KPI label="Total Revenue"    value={`GHS ${Number(stats?.total_revenue || 0).toFixed(2)}`} />
        <KPI label="Total Sales"      value={stats?.total_sales   || 0} />
        <KPI label="Active Routers"   value={stats?.routers       || 0} />
      </div>

      {/* Transactions */}
      <div style={s.section}>
        <div style={s.sectionHead}>
          <div style={s.sectionTitle}>Recent transactions</div>
          <a href="/payments" style={s.seeAll}>See all →</a>
        </div>
        {wallet?.transactions?.length > 0 ? (
          <table style={s.table}>
            <thead>
              <tr>
                {['Description','Type','Amount','Date'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wallet.transactions.slice(0, 8).map(tx => (
                <tr key={tx.id} style={s.tr}>
                  <td style={s.td}>{tx.description}</td>
                  <td style={s.td}><TxBadge type={tx.type} /></td>
                  <td style={{...s.td, fontWeight:600, color: tx.type === 'credit' ? '#15803D' : '#B91C1C'}}>
                    {tx.type === 'credit' ? '+' : '-'}GHS {Number(tx.amount).toFixed(2)}
                  </td>
                  <td style={{...s.td, color:'#9CA3AF'}}>{fmt(tx.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState icon="💳" text="No transactions yet. Sales will appear here." />
        )}
      </div>

      {showModal && (
        <WithdrawModal
          balance={balance}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            api.get('/wallet/').then(w => setWallet(w.data))
            setShowModal(false)
          }}
        />
      )}
    </Layout>
  )
}

function WithdrawModal({ balance, onClose, onSuccess }) {
  const [form,    setForm]    = useState({ amount:'', momo_number:'', momo_name:'' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function set(k) { return e => setForm(f => ({...f, [k]: e.target.value})) }

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.post('/wallet/withdraw/', form)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Withdrawal failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={m.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={m.box}>
        <div style={m.head}>
          <div>
            <div style={m.title}>Withdraw to MoMo</div>
            <div style={m.sub}>Available: GHS {balance.toFixed(2)}</div>
          </div>
          <button style={m.close} onClick={onClose}>✕</button>
        </div>
        {error && <div style={m.err}>{error}</div>}
        <form onSubmit={submit}>
          <MField label="Amount (GHS)" type="number" step="0.01" min="5" placeholder="0.00" value={form.amount} onChange={set('amount')} required />
          <MField label="MoMo number" type="tel" placeholder="0244 000 000" value={form.momo_number} onChange={set('momo_number')} required />
          <MField label="Account name" placeholder="Full name on the account" value={form.momo_name} onChange={set('momo_name')} required />
          <button style={m.btn} disabled={loading}>{loading ? 'Processing…' : 'Withdraw'}</button>
        </form>
      </div>
    </div>
  )
}

function MField({ label, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={m.label}>{label}</label>
      <input style={m.input} {...props} />
    </div>
  )
}

function KPI({ label, value, accent }) {
  return (
    <div style={{...s.kpi, ...(accent ? s.kpiAccent : {})}}>
      <div style={{...s.kpiVal, ...(accent ? s.kpiValAccent : {})}}>{value}</div>
      <div style={{...s.kpiLabel, ...(accent ? {color:'rgba(255,255,255,.55)'} : {})}}>{label}</div>
    </div>
  )
}

function TxBadge({ type }) {
  const style = type === 'credit'
    ? { background:'#DCFCE7', color:'#15803D' }
    : { background:'#FEE2E2', color:'#B91C1C' }
  return <span style={{...badge, ...style}}>{type}</span>
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign:'center', padding:'40px 0', color:'#9CA3AF' }}>
      <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:13 }}>{text}</div>
    </div>
  )
}

function Skeleton() {
  return <div style={{ color:'#9CA3AF', padding:'40px 0', textAlign:'center' }}>Loading…</div>
}

function fmt(d) {
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
}

const badge = { display:'inline-block', fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, textTransform:'capitalize' }

const s = {
  walletHero:   { background:'#1C2B45', borderRadius:12, padding:'24px 28px', marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center', gap:16 },
  heroLabel:    { fontSize:11, fontWeight:600, color:'rgba(255,255,255,.45)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 },
  heroAmount:   { fontSize:36, fontWeight:800, color:'#BF7E08', letterSpacing:'-1px', marginBottom:4 },
  heroSub:      { fontSize:12, color:'rgba(255,255,255,.35)' },
  withdrawBtn:  { background:'#BF7E08', color:'#fff', border:'none', padding:'11px 24px', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap', letterSpacing:'.2px' },
  kpiRow:       { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:10, marginBottom:20 },
  kpi:          { background:'#fff', borderRadius:10, padding:'16px 20px', border:'1px solid #E8E5DE' },
  kpiAccent:    { background:'#1C2B45', border:'none' },
  kpiVal:       { fontSize:24, fontWeight:800, color:'#1C2B45', letterSpacing:'-0.5px', marginBottom:4 },
  kpiValAccent: { color:'#BF7E08' },
  kpiLabel:     { fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:.8 },
  section:      { background:'#fff', borderRadius:10, border:'1px solid #E8E5DE' },
  sectionHead:  { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #F0EEE8' },
  sectionTitle: { fontSize:14, fontWeight:700, color:'#1C2B45' },
  seeAll:       { fontSize:12, fontWeight:600, color:'#BF7E08' },
  table:        { width:'100%', borderCollapse:'collapse' },
  th:           { padding:'10px 20px', textAlign:'left', fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:.8, background:'#FAFAF8' },
  tr:           { borderTop:'1px solid #F0EEE8' },
  td:           { padding:'13px 20px', fontSize:13, color:'#1C2B45' },
}

const m = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, zIndex:200 },
  box:     { background:'#fff', borderRadius:12, padding:'24px', width:'100%', maxWidth:400, boxShadow:'0 20px 60px rgba(0,0,0,.15)' },
  head:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  title:   { fontSize:17, fontWeight:700, color:'#1C2B45', marginBottom:3 },
  sub:     { fontSize:13, color:'#9CA3AF' },
  close:   { background:'none', border:'none', fontSize:16, color:'#9CA3AF', cursor:'pointer', padding:'2px 6px', lineHeight:1 },
  err:     { background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 },
  label:   { display:'block', fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:6 },
  input:   { display:'block', width:'100%', padding:'11px 14px', border:'1.5px solid #E5E3DC', borderRadius:8, fontSize:14, color:'#1C2B45', outline:'none', boxSizing:'border-box', background:'#fff' },
  btn:     { display:'block', width:'100%', marginTop:4, padding:'13px', background:'#1C2B45', color:'#fff', fontSize:14, fontWeight:700, border:'none', borderRadius:8, cursor:'pointer' },
}
