import { useState, useEffect } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'

const STATUS_COLOR = {
  success:   { bg:'#E8F5EE', color:'#2D7A4F' },
  pending:   { bg:'#FFF8E6', color:'#BF7E08' },
  failed:    { bg:'#FEF2F2', color:'#CB3030' },
  cancelled: { bg:'#F0EFE9', color:'#8C9BAD' },
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    api.get('/payments/history/')
      .then(r => setPayments(r.data))
      .finally(() => setLoading(false))
  }, [])

  const shown = filter === 'all' ? payments : payments.filter(p => p.status === filter)

  return (
    <Layout title="Payment History">
      <div style={styles.filters}>
        {['all','success','pending','failed'].map(f => (
          <button
            key={f}
            style={{...styles.filterBtn, ...(filter===f ? styles.filterActive : {})}}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div style={styles.hint}>Loading…</div>}
      {!loading && shown.length === 0 && <div style={styles.empty}>No payments found.</div>}

      <div style={styles.list}>
        {shown.map(p => (
          <div key={p.id} style={styles.row}>
            <div style={styles.rowLeft}>
              <div style={styles.phone}>{p.phone_number}</div>
              <div style={styles.meta}>{p.package_name} · {p.router_name}</div>
              <div style={styles.date}>{new Date(p.created_at).toLocaleString()}</div>
            </div>
            <div style={styles.rowRight}>
              <div style={styles.amount}>GHS {Number(p.amount_ghs).toFixed(2)}</div>
              <div style={styles.isp}>You get: GHS {Number(p.isp_amount).toFixed(2)}</div>
              <span style={{...styles.badge, ...STATUS_COLOR[p.status]}}>
                {p.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}

const styles = {
  filters:      { display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' },
  filterBtn:    { padding:'7px 16px', background:'#fff', border:'1.5px solid #D8DDEA', borderRadius:20, fontSize:12, fontWeight:600, color:'#8C9BAD', cursor:'pointer' },
  filterActive: { background:'#1C2B45', borderColor:'#1C2B45', color:'#fff' },
  hint:         { fontSize:13, color:'#8C9BAD' },
  empty:        { textAlign:'center', color:'#8C9BAD', fontSize:14, padding:'40px 0' },
  list:         { display:'flex', flexDirection:'column', gap:8 },
  row:          { background:'#fff', borderRadius:8, padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, boxShadow:'0 1px 4px rgba(28,43,69,.07)' },
  rowLeft:      { flex:1 },
  phone:        { fontSize:14, fontWeight:700, color:'#1C2B45', marginBottom:2 },
  meta:         { fontSize:12, color:'#8C9BAD', marginBottom:2 },
  date:         { fontSize:11, color:'#A8B4BE' },
  rowRight:     { textAlign:'right', flexShrink:0 },
  amount:       { fontSize:15, fontWeight:800, color:'#1C2B45', marginBottom:2 },
  isp:          { fontSize:11, color:'#2D7A4F', marginBottom:6 },
  badge:        { display:'inline-block', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, letterSpacing:.5 },
}
