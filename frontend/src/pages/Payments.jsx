import { useState, useEffect } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'

const FILTERS = ['all','success','pending','failed']

const STATUS = {
  success:   { bg:'#DCFCE7', color:'#15803D' },
  pending:   { bg:'#FEF3C7', color:'#92400E' },
  failed:    { bg:'#FEE2E2', color:'#B91C1C' },
  cancelled: { bg:'#F3F4F6', color:'#6B7280' },
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
  const total = shown.reduce((sum, p) => sum + Number(p.isp_amount || 0), 0)

  return (
    <Layout title="Payment History">
      {/* Summary strip */}
      <div style={s.strip}>
        <div style={s.stripItem}>
          <div style={s.stripVal}>{shown.length}</div>
          <div style={s.stripLabel}>Transactions</div>
        </div>
        <div style={s.stripDivider} />
        <div style={s.stripItem}>
          <div style={s.stripVal}>GHS {total.toFixed(2)}</div>
          <div style={s.stripLabel}>Your earnings</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={s.tabs}>
        {FILTERS.map(f => (
          <button
            key={f}
            style={{...s.tab, ...(filter === f ? s.tabActive : {})}}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={s.card}>
        {loading ? (
          <div style={s.empty}>Loading…</div>
        ) : shown.length === 0 ? (
          <div style={s.empty}>No payments found.</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Customer','Package','Router','Gross','Your Cut','Status','Date'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map(p => (
                <tr key={p.id} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.phone}>{p.phone_number}</div>
                  </td>
                  <td style={s.td}>{p.package_name}</td>
                  <td style={s.td}>{p.router_name}</td>
                  <td style={s.td}>GHS {Number(p.amount_ghs).toFixed(2)}</td>
                  <td style={{...s.td, fontWeight:700, color:'#15803D'}}>
                    GHS {Number(p.isp_amount).toFixed(2)}
                  </td>
                  <td style={s.td}>
                    <span style={{...s.badge, ...STATUS[p.status]}}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{...s.td, color:'#9CA3AF'}}>
                    {new Date(p.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}

const s = {
  strip:       { display:'flex', alignItems:'center', background:'#fff', borderRadius:10, border:'1px solid #E8E5DE', padding:'16px 24px', marginBottom:16, gap:24 },
  stripItem:   {},
  stripVal:    { fontSize:22, fontWeight:800, color:'#1C2B45', letterSpacing:'-0.5px' },
  stripLabel:  { fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:.8, marginTop:2 },
  stripDivider:{ width:1, height:36, background:'#E8E5DE' },
  tabs:        { display:'flex', gap:4, marginBottom:12 },
  tab:         { padding:'7px 16px', background:'#fff', border:'1px solid #E5E3DC', borderRadius:20, fontSize:12, fontWeight:600, color:'#9CA3AF', cursor:'pointer' },
  tabActive:   { background:'#1C2B45', borderColor:'#1C2B45', color:'#fff' },
  card:        { background:'#fff', borderRadius:10, border:'1px solid #E8E5DE', overflow:'hidden' },
  empty:       { padding:'48px', textAlign:'center', color:'#9CA3AF', fontSize:13 },
  table:       { width:'100%', borderCollapse:'collapse' },
  th:          { padding:'11px 20px', textAlign:'left', fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:.8, background:'#FAFAF8', borderBottom:'1px solid #F0EEE8', whiteSpace:'nowrap' },
  tr:          { borderTop:'1px solid #F0EEE8', transition:'background .1s' },
  td:          { padding:'14px 20px', fontSize:13, color:'#1C2B45' },
  phone:       { fontWeight:600 },
  badge:       { display:'inline-block', fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, textTransform:'capitalize' },
}
