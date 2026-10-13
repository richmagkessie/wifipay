import { useState } from 'react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard',  icon: <GridIcon /> },
  { href: '/routers',   label: 'Routers',    icon: <RouterIcon /> },
  { href: '/vouchers',  label: 'Vouchers',   icon: <TicketIcon /> },
  { href: '/payments',  label: 'Payments',   icon: <CardIcon /> },
]

export default function Layout({ title, children, action, back }) {
  const path = window.location.pathname

  function logout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    window.location.href = '/login'
  }

  return (
    <div style={s.shell}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <div style={s.brandMark}>W</div>
          <span style={s.brandName}>WifiPay</span>
        </div>

        <nav style={s.nav}>
          {NAV.map(item => (
            <a
              key={item.href}
              href={item.href}
              style={{...s.navItem, ...(path.startsWith(item.href) ? s.navActive : {})}}
            >
              <span style={s.navIcon}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <button style={s.logoutBtn} onClick={logout}>
          <LogoutIcon />
          Logout
        </button>
      </aside>

      {/* Main */}
      <main style={s.main}>
        <div style={s.topbar}>
          <div style={s.topbarLeft}>
            {back && <a href={back} style={s.back}>← Back</a>}
            <h1 style={s.pageTitle}>{title}</h1>
          </div>
          {action && <div>{action}</div>}
        </div>

        <div style={s.body}>
          {children}
        </div>
      </main>
    </div>
  )
}

// ─── icons ────────────────────────────────────────────────────────────────────
function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
}
function RouterIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="14" width="20" height="6" rx="2"/><path d="M6 14V9M12 14V9M18 14V9M6 9a6 6 0 0 1 12 0"/></svg>
}
function TicketIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 1 0 0 4v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1a2 2 0 1 0 0-4V9z"/></svg>
}
function CardIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
}
function LogoutIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = {
  shell:      { display:'flex', height:'100vh', background:'#F4F3EF' },
  sidebar:    { width:220, background:'#1C2B45', display:'flex', flexDirection:'column', flexShrink:0 },
  brand:      { display:'flex', alignItems:'center', gap:10, padding:'22px 20px 18px', borderBottom:'1px solid rgba(255,255,255,.08)' },
  brandMark:  { width:32, height:32, background:'#BF7E08', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#fff', flexShrink:0 },
  brandName:  { fontSize:16, fontWeight:800, color:'#fff', letterSpacing:'-0.3px' },
  nav:        { flex:1, padding:'14px 10px', display:'flex', flexDirection:'column', gap:2 },
  navItem:    { display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:7, fontSize:13, fontWeight:500, color:'rgba(255,255,255,.55)', transition:'all .15s' },
  navActive:  { background:'rgba(255,255,255,.1)', color:'#fff' },
  navIcon:    { opacity:.8, display:'flex' },
  logoutBtn:  { display:'flex', alignItems:'center', gap:8, margin:'0 10px 16px', padding:'9px 12px', background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:12, fontWeight:500, borderRadius:7, cursor:'pointer' },
  main:       { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  topbar:     { background:'#fff', borderBottom:'1px solid #E8E5DE', padding:'0 28px', height:58, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
  topbarLeft: { display:'flex', flexDirection:'column', gap:2 },
  back:       { fontSize:11, color:'#9CA3AF', fontWeight:500 },
  pageTitle:  { fontSize:18, fontWeight:700, color:'#1C2B45', letterSpacing:'-0.3px' },
  body:       { flex:1, overflowY:'auto', padding:'24px 28px' },
}
