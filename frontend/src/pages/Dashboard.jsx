import { useState, useEffect } from 'react'
import api from '../api/client'

export default function Dashboard() {
  const [stats,      setStats]      = useState(null)
  const [wallet,     setWallet]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/payments/dashboard/stats/'),
      api.get('/wallet/'),
    ]).then(([s, w]) => {
      setStats(s.data)
      setWallet(w.data)
    }).finally(() => setLoading(false))
  }, [])

  function logout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    window.location.href = '/login'
  }

  if (loading) return <div style={styles.center}>Loading…</div>

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div style={styles.logo}>WifiPay</div>
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>

      <div style={styles.content}>
        <div style={styles.pageTitle}>Dashboard</div>

        {/* Wallet balance — prominent */}
        <div style={styles.walletCard}>
          <div style={styles.walletLeft}>
            <div style={styles.walletLabel}>Your Balance</div>
            <div style={styles.walletAmount}>GHS {Number(wallet?.balance || 0).toFixed(2)}</div>
            <div style={styles.walletSub}>
              Total earned: GHS {Number(wallet?.total_earned || 0).toFixed(2)} &nbsp;·&nbsp;
              Withdrawn: GHS {Number(wallet?.total_withdrawn || 0).toFixed(2)}
            </div>
          </div>
          <button style={styles.withdrawBtn} onClick={() => setShowModal(true)}>
            Withdraw
          </button>
        </div>

        <div style={styles.statsGrid}>
          <StatCard label="Today's Sales"  value={stats?.today_sales   || 0} />
          <StatCard label="Today's Revenue" value={`GHS ${Number(stats?.today_revenue || 0).toFixed(2)}`} />
          <StatCard label="Total Sales"    value={stats?.total_sales   || 0} />
          <StatCard label="Total Revenue"  value={`GHS ${Number(stats?.total_revenue || 0).toFixed(2)}`} />
          <StatCard label="Active Routers" value={stats?.routers       || 0} />
        </div>

        {/* Recent transactions */}
        {wallet?.transactions?.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Recent transactions</div>
            {wallet.transactions.slice(0, 10).map(tx => (
              <div key={tx.id} style={styles.txRow}>
                <div>
                  <div style={styles.txDesc}>{tx.description}</div>
                  <div style={styles.txDate}>{new Date(tx.created_at).toLocaleString()}</div>
                </div>
                <div style={{...styles.txAmount, color: tx.type === 'credit' ? '#2D7A4F' : '#CB3030'}}>
                  {tx.type === 'credit' ? '+' : '-'}GHS {Number(tx.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Quick links</div>
          <div style={styles.links}>
            <a style={styles.link} href="/routers">Manage Routers</a>
            <a style={styles.link} href="/vouchers">Voucher Batches</a>
            <a style={styles.link} href="/payments">Payment History</a>
          </div>
        </div>
      </div>

      {showModal && (
        <WithdrawModal
          balance={wallet?.balance || 0}
          onClose={() => setShowModal(false)}
          onSuccess={(newBalance) => {
            setWallet(w => ({...w, balance: newBalance}))
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

function WithdrawModal({ balance, onClose, onSuccess }) {
  const [form,    setForm]    = useState({ amount: '', momo_number: '', momo_name: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function set(k) { return e => setForm(f => ({...f, [k]: e.target.value})) }

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/wallet/withdraw/', form)
      const w = await api.get('/wallet/')
      onSuccess(w.data.balance)
    } catch (err) {
      setError(err.response?.data?.error || 'Withdrawal failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalTitle}>Withdraw to MoMo</div>
        <div style={styles.modalSub}>Available: GHS {Number(balance).toFixed(2)}</div>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={submit}>
          <input style={styles.input} placeholder="Amount (GHS)" type="number" step="0.01" min="5"
            value={form.amount} onChange={set('amount')} required />
          <input style={styles.input} placeholder="MoMo number (e.g. 0244...)" type="tel"
            value={form.momo_number} onChange={set('momo_number')} required />
          <input style={styles.input} placeholder="Account name"
            value={form.momo_name} onChange={set('momo_name')} required />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Processing…' : 'Withdraw'}
          </button>
          <button style={styles.btnBack} type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardValue}>{value}</div>
      <div style={styles.cardLabel}>{label}</div>
    </div>
  )
}

const styles = {
  page:         { minHeight:'100vh', background:'#F5F4F0', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  center:       { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#8C9BAD' },
  topbar:       { background:'#1C2B45', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  logo:         { color:'#fff', fontSize:18, fontWeight:800 },
  logoutBtn:    { background:'transparent', border:'1px solid rgba(255,255,255,.3)', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:12 },
  content:      { maxWidth:900, margin:'0 auto', padding:'24px 16px' },
  pageTitle:    { fontSize:20, fontWeight:700, color:'#1C2B45', marginBottom:16 },

  walletCard:   { background:'#1C2B45', borderRadius:10, padding:'20px 22px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 },
  walletLeft:   { flex:1 },
  walletLabel:  { fontSize:11, color:'rgba(255,255,255,.5)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 },
  walletAmount: { fontSize:30, fontWeight:800, color:'#BF7E08', marginBottom:4 },
  walletSub:    { fontSize:11, color:'rgba(255,255,255,.45)' },
  withdrawBtn:  { background:'#BF7E08', color:'#fff', border:'none', padding:'11px 22px', borderRadius:7, fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' },

  statsGrid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10, marginBottom:20 },
  card:         { background:'#fff', borderRadius:8, padding:'14px 16px', boxShadow:'0 1px 4px rgba(28,43,69,.06)' },
  cardValue:    { fontSize:20, fontWeight:800, color:'#1C2B45', marginBottom:3 },
  cardLabel:    { fontSize:11, color:'#8C9BAD', textTransform:'uppercase', letterSpacing:.8 },

  section:      { background:'#fff', borderRadius:8, padding:'18px 20px', boxShadow:'0 1px 4px rgba(28,43,69,.06)', marginBottom:16 },
  sectionTitle: { fontSize:13, fontWeight:700, color:'#1C2B45', marginBottom:12 },
  txRow:        { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #F5F4F0' },
  txDesc:       { fontSize:13, color:'#1C2B45', marginBottom:2 },
  txDate:       { fontSize:11, color:'#A8B4BE' },
  txAmount:     { fontSize:14, fontWeight:700 },

  links:        { display:'flex', gap:10, flexWrap:'wrap' },
  link:         { padding:'8px 16px', background:'#F0EFE9', borderRadius:6, fontSize:13, color:'#1C2B45', textDecoration:'none', fontWeight:600 },

  overlay:      { position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, zIndex:100 },
  modal:        { background:'#fff', borderRadius:10, padding:'24px 20px', width:'100%', maxWidth:360 },
  modalTitle:   { fontSize:16, fontWeight:700, color:'#1C2B45', marginBottom:4 },
  modalSub:     { fontSize:12, color:'#8C9BAD', marginBottom:16 },
  error:        { fontSize:12, color:'#A02828', background:'#FEF2F2', borderLeft:'3px solid #CB3030', padding:'8px 12px', borderRadius:'0 5px 5px 0', marginBottom:14 },
  input:        { display:'block', width:'100%', padding:'12px 14px', border:'1.5px solid #D8DDEA', borderRadius:7, fontSize:14, color:'#1C2B45', outline:'none', marginBottom:10, boxSizing:'border-box' },
  btn:          { display:'block', width:'100%', padding:13, background:'#1C2B45', color:'#fff', fontSize:14, fontWeight:700, border:'none', borderRadius:7, cursor:'pointer', marginBottom:8 },
  btnBack:      { display:'block', width:'100%', padding:11, background:'transparent', border:'1.5px solid #D8DDEA', borderRadius:7, color:'#8C9BAD', fontSize:13, fontWeight:600, cursor:'pointer' },
}
