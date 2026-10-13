import { useState } from 'react'
import api from '../api/client'

export default function Login() {
  const [mode,     setMode]     = useState('login') // login | register
  const [form,     setForm]     = useState({ email:'', password:'', business_name:'', phone:'' })
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  function set(k) { return e => setForm(f => ({...f, [k]: e.target.value})) }

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const endpoint = mode === 'login' ? '/auth/login/' : '/auth/register/'
      const r = await api.post(endpoint, form)
      localStorage.setItem('access',  r.data.access)
      localStorage.setItem('refresh', r.data.refresh)
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.brand}>
        <div style={styles.brandName}>WifiPay</div>
        <div style={styles.brandTag}>ISP Management Portal</div>
      </div>

      <div style={styles.card}>
        <div style={styles.tabs}>
          <button style={{...styles.tab, ...(mode==='login'    ? styles.tabActive : {})}} onClick={() => setMode('login')}>Login</button>
          <button style={{...styles.tab, ...(mode==='register' ? styles.tabActive : {})}} onClick={() => setMode('register')}>Register</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <>
              <input style={styles.input} placeholder="Business name" value={form.business_name} onChange={set('business_name')} required />
              <input style={styles.input} placeholder="Phone number" type="tel" value={form.phone} onChange={set('phone')} required />
            </>
          )}
          <input style={styles.input} placeholder="Email address" type="email" value={form.email} onChange={set('email')} required />
          <input style={styles.input} placeholder="Password" type="password" value={form.password} onChange={set('password')} required />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>

      <div style={styles.footer}>Powered by WifiPay · RXR PRIME LTD</div>
    </div>
  )
}

const styles = {
  page:       { minHeight:'100vh', background:'#ECEAE3', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  brand:      { textAlign:'center', marginBottom:20 },
  brandName:  { fontSize:24, fontWeight:800, color:'#1C2B45' },
  brandTag:   { fontSize:10, letterSpacing:2, color:'#8C9BAD', textTransform:'uppercase', marginTop:4 },
  card:       { width:'100%', maxWidth:360, background:'#fff', borderRadius:10, padding:'24px 20px', boxShadow:'0 2px 16px rgba(28,43,69,.08)' },
  tabs:       { display:'flex', marginBottom:20, borderBottom:'1px solid #EEF0F4' },
  tab:        { flex:1, padding:'10px', background:'none', border:'none', fontSize:14, fontWeight:600, color:'#8C9BAD', cursor:'pointer', borderBottom:'2px solid transparent' },
  tabActive:  { color:'#1C2B45', borderBottomColor:'#BF7E08' },
  error:      { fontSize:12, color:'#A02828', background:'#FEF2F2', borderLeft:'3px solid #CB3030', padding:'8px 12px', borderRadius:'0 5px 5px 0', marginBottom:14 },
  input:      { display:'block', width:'100%', padding:'12px 14px', border:'1.5px solid #D8DDEA', borderRadius:7, fontSize:14, color:'#1C2B45', outline:'none', marginBottom:10 },
  btn:        { display:'block', width:'100%', padding:13, background:'#1C2B45', color:'#fff', fontSize:14, fontWeight:700, border:'none', borderRadius:7, cursor:'pointer' },
  footer:     { marginTop:20, fontSize:10, color:'#A8B4BE', textAlign:'center' },
}
