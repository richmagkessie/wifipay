import { useState } from 'react'
import api from '../api/client'

export default function Login() {
  const [mode,    setMode]    = useState('login')
  const [form,    setForm]    = useState({ email:'', password:'', business_name:'', phone:'' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

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
      const data = err.response?.data
      setError(data?.detail || data?.non_field_errors?.[0] || JSON.stringify(data) || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.mark}>W</div>
          <div style={s.tagline}>WifiPay</div>
          <p style={s.desc}>The hotspot management platform for growing ISPs across Africa.</p>
          <div style={s.features}>
            {['Sell vouchers online', 'Manage multiple routers', 'Instant MoMo payouts', 'Real-time dashboard'].map(f => (
              <div key={f} style={s.feature}>
                <span style={s.check}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.right}>
        <div style={s.card}>
          <div style={s.cardTitle}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </div>
          <div style={s.cardSub}>
            {mode === 'login' ? 'Sign in to your ISP dashboard' : 'Start selling Wi-Fi in minutes'}
          </div>

          {error && <div style={s.errorBox}>{error}</div>}

          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                <Field label="Business name" placeholder="e.g. BELORA Connect" value={form.business_name} onChange={set('business_name')} required />
                <Field label="Phone number" type="tel" placeholder="0244 000 000" value={form.phone} onChange={set('phone')} required />
              </>
            )}
            <Field label="Email address" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
            <Field label="Password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />

            <button style={{...s.btn, opacity: loading ? .7 : 1}} type="submit" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div style={s.toggle}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button style={s.toggleBtn} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={s.label}>{label}</label>
      <input style={s.input} {...props} />
    </div>
  )
}

const s = {
  page:      { display:'flex', minHeight:'100vh', fontFamily:'Inter, sans-serif' },
  left:      { flex:1, background:'#1C2B45', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 40px' },
  leftInner: { maxWidth:380 },
  mark:      { width:48, height:48, background:'#BF7E08', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#fff', marginBottom:24 },
  tagline:   { fontSize:32, fontWeight:800, color:'#fff', letterSpacing:'-1px', marginBottom:10 },
  desc:      { fontSize:15, color:'rgba(255,255,255,.5)', lineHeight:1.6, marginBottom:32 },
  features:  { display:'flex', flexDirection:'column', gap:12 },
  feature:   { fontSize:14, color:'rgba(255,255,255,.7)', display:'flex', alignItems:'center', gap:10 },
  check:     { color:'#BF7E08', fontWeight:700 },
  right:     { width:460, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 48px', background:'#F4F3EF' },
  card:      { width:'100%', maxWidth:380 },
  cardTitle: { fontSize:24, fontWeight:800, color:'#1C2B45', letterSpacing:'-0.5px', marginBottom:6 },
  cardSub:   { fontSize:14, color:'#9CA3AF', marginBottom:28 },
  errorBox:  { background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C', padding:'11px 14px', borderRadius:8, fontSize:13, marginBottom:18, lineHeight:1.4 },
  label:     { display:'block', fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:6, letterSpacing:'.3px' },
  input:     { display:'block', width:'100%', padding:'11px 14px', border:'1.5px solid #E5E3DC', borderRadius:8, fontSize:14, color:'#1C2B45', background:'#fff', outline:'none', transition:'border-color .15s', boxSizing:'border-box' },
  btn:       { display:'block', width:'100%', padding:'13px', background:'#1C2B45', color:'#fff', fontSize:14, fontWeight:700, border:'none', borderRadius:8, cursor:'pointer', marginTop:6, letterSpacing:'.2px' },
  toggle:    { fontSize:13, color:'#9CA3AF', textAlign:'center', marginTop:20 },
  toggleBtn: { background:'none', border:'none', color:'#BF7E08', fontWeight:700, fontSize:13, cursor:'pointer', padding:0 },
}
