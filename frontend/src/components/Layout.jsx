export default function Layout({ title, children, action, back }) {
  function logout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    window.location.href = '/login'
  }

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <a href="/dashboard" style={styles.logo}>WifiPay</a>
        <nav style={styles.nav}>
          <a style={styles.navLink} href="/routers">Routers</a>
          <a style={styles.navLink} href="/vouchers">Vouchers</a>
          <a style={styles.navLink} href="/payments">Payments</a>
        </nav>
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            {back && <a href={back} style={styles.back}>← Back</a>}
            <div style={styles.title}>{title}</div>
          </div>
          {action && <div>{action}</div>}
        </div>
        {children}
      </div>
    </div>
  )
}

const styles = {
  page:       { minHeight:'100vh', background:'#F5F4F0', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  topbar:     { background:'#1C2B45', padding:'0 24px', display:'flex', alignItems:'center', gap:24, height:52 },
  logo:       { color:'#fff', fontSize:17, fontWeight:800, textDecoration:'none', marginRight:8 },
  nav:        { display:'flex', gap:4, flex:1 },
  navLink:    { color:'rgba(255,255,255,.65)', fontSize:13, fontWeight:600, textDecoration:'none', padding:'6px 12px', borderRadius:6 },
  logoutBtn:  { background:'transparent', border:'1px solid rgba(255,255,255,.25)', color:'rgba(255,255,255,.7)', padding:'5px 13px', borderRadius:6, cursor:'pointer', fontSize:12 },
  content:    { maxWidth:900, margin:'0 auto', padding:'24px 16px' },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 },
  headerLeft: { display:'flex', flexDirection:'column', gap:4 },
  back:       { fontSize:12, color:'#8C9BAD', textDecoration:'none', fontWeight:600 },
  title:      { fontSize:20, fontWeight:700, color:'#1C2B45' },
}
