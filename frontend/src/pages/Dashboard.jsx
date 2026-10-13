import { useState, useEffect } from 'react'
import api from '../api/client'

export default function Dashboard() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/payments/dashboard/stats/')
      .then(r => setStats(r.data))
      .finally(() => setLoading(false))
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

        <div style={styles.statsGrid}>
          <StatCard label="Today's Revenue" value={`GHS ${stats?.today_revenue?.toFixed(2) || '0.00'}`} accent />
          <StatCard label="Today's Sales"   value={stats?.today_sales || 0} />
          <StatCard label="Total Revenue"   value={`GHS ${stats?.total_revenue?.toFixed(2) || '0.00'}`} />
          <StatCard label="Total Sales"     value={stats?.total_sales || 0} />
          <StatCard label="Active Routers"  value={stats?.routers || 0} />
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Quick links</div>
          <div style={styles.links}>
            <a style={styles.link} href="/routers">Manage Routers</a>
            <a style={styles.link} href="/vouchers">Voucher Batches</a>
            <a style={styles.link} href="/payments">Payment History</a>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{...styles.card, ...(accent ? styles.cardAccent : {})}}>
      <div style={{...styles.cardValue, ...(accent ? styles.cardValueAccent : {})}}>{value}</div>
      <div style={styles.cardLabel}>{label}</div>
    </div>
  )
}

const styles = {
  page:           { minHeight:'100vh', background:'#F5F4F0', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  center:         { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#8C9BAD' },
  topbar:         { background:'#1C2B45', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  logo:           { color:'#fff', fontSize:18, fontWeight:800 },
  logoutBtn:      { background:'transparent', border:'1px solid rgba(255,255,255,.3)', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:12 },
  content:        { maxWidth:900, margin:'0 auto', padding:'24px 16px' },
  pageTitle:      { fontSize:20, fontWeight:700, color:'#1C2B45', marginBottom:20 },
  statsGrid:      { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:28 },
  card:           { background:'#fff', borderRadius:8, padding:'16px 18px', boxShadow:'0 1px 4px rgba(28,43,69,.06)' },
  cardAccent:     { background:'#1C2B45' },
  cardValue:      { fontSize:22, fontWeight:800, color:'#1C2B45', marginBottom:4 },
  cardValueAccent:{ color:'#BF7E08' },
  cardLabel:      { fontSize:11, color:'#8C9BAD', textTransform:'uppercase', letterSpacing:.8 },
  section:        { background:'#fff', borderRadius:8, padding:'18px 20px', boxShadow:'0 1px 4px rgba(28,43,69,.06)' },
  sectionTitle:   { fontSize:13, fontWeight:700, color:'#1C2B45', marginBottom:12 },
  links:          { display:'flex', gap:10, flexWrap:'wrap' },
  link:           { padding:'8px 16px', background:'#F0EFE9', borderRadius:6, fontSize:13, color:'#1C2B45', textDecoration:'none', fontWeight:600 },
}
