import { useState, useEffect } from 'react'
import api from '../api/client'

// Captive portal injects: ?router_id=X&mac=X&ip=X
function useQuery() {
  return new URLSearchParams(window.location.search)
}

const PACKAGES = [] // loaded from API

export default function PayPage() {
  const q          = useQuery()
  const routerId   = q.get('router_id') || ''
  const mac        = q.get('mac') || ''
  const ip         = q.get('ip') || ''

  const [packages,   setPackages]   = useState([])
  const [selected,   setSelected]   = useState(null)
  const [phone,      setPhone]      = useState('')
  const [step,       setStep]       = useState('select') // select | phone | processing | success | error
  const [paymentId,  setPaymentId]  = useState(null)
  const [loginUrl,   setLoginUrl]   = useState(null)
  const [error,      setError]      = useState('')

  useEffect(() => {
    if (!routerId) return
    api.get(`/hotspot/routers/${routerId}/packages/`)
      .then(r => setPackages(r.data))
      .catch(() => setError('Could not load packages'))
  }, [routerId])

  async function handlePay() {
    if (!phone.match(/^0[0-9]{9}$/)) {
      setError('Enter a valid 10-digit Ghana phone number')
      return
    }
    setStep('processing')
    setError('')
    try {
      const r = await api.post('/payments/initiate/', {
        router_id: routerId,
        package_id: selected.id,
        phone, mac, ip,
      })
      setPaymentId(r.data.payment_id)
      pollStatus(r.data.payment_id)
    } catch (e) {
      setError(e.response?.data?.error || 'Payment failed. Try again.')
      setStep('phone')
    }
  }

  function pollStatus(pid) {
    const interval = setInterval(async () => {
      try {
        const r = await api.get(`/payments/${pid}/status/`)
        if (r.data.status === 'success') {
          clearInterval(interval)
          setLoginUrl(r.data.login_url)
          setStep('success')
        } else if (r.data.status === 'failed') {
          clearInterval(interval)
          setError('Payment was not completed. Please try again.')
          setStep('error')
        }
      } catch {}
    }, 3000)
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000) // stop after 5min
  }

  function autoLogin() {
    window.location.href = loginUrl
  }

  return (
    <div style={styles.page}>
      <div style={styles.brand}>
        <div style={styles.brandName}>WifiPay</div>
        <div style={styles.brandTag}>Fast · Secure · Instant</div>
      </div>

      <div style={styles.card}>
        {step === 'select' && (
          <>
            <div style={styles.heading}>Choose a package</div>
            {error && <div style={styles.error}>{error}</div>}
            {packages.length === 0 && !error && <div style={styles.hint}>Loading packages…</div>}
            <div style={styles.pkgGrid}>
              {packages.map(pkg => (
                <div
                  key={pkg.id}
                  style={{...styles.pkg, ...(selected?.id === pkg.id ? styles.pkgSelected : {})}}
                  onClick={() => setSelected(pkg)}
                >
                  <div style={styles.pkgName}>{pkg.name}</div>
                  <div style={styles.pkgPrice}>GHS {pkg.price_ghs}</div>
                  <div style={styles.pkgMeta}>{pkg.speed_mbps} Mbps · {pkg.duration}</div>
                </div>
              ))}
            </div>
            {selected && (
              <button style={styles.btn} onClick={() => setStep('phone')}>
                Continue with {selected.name}
              </button>
            )}
          </>
        )}

        {step === 'phone' && (
          <>
            <div style={styles.heading}>Enter your MoMo number</div>
            <div style={styles.subheading}>{selected.name} — GHS {selected.price_ghs}</div>
            {error && <div style={styles.error}>{error}</div>}
            <input
              style={styles.input}
              type="tel"
              placeholder="0XX XXX XXXX"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\s/g, ''))}
              maxLength={10}
            />
            <button style={styles.btn} onClick={handlePay}>Pay GHS {selected.price_ghs}</button>
            <button style={styles.btnBack} onClick={() => setStep('select')}>Back</button>
          </>
        )}

        {step === 'processing' && (
          <>
            <div style={styles.heading}>Processing payment…</div>
            <div style={styles.hint}>A prompt has been sent to {phone}. Approve it on your phone.</div>
            <div style={styles.spinner}></div>
            <div style={styles.hint}>Do not close this page.</div>
          </>
        )}

        {step === 'success' && (
          <>
            <div style={styles.successIcon}>✓</div>
            <div style={styles.heading}>Payment successful!</div>
            <div style={styles.hint}>Tap below to connect instantly.</div>
            <button style={styles.btn} onClick={autoLogin}>Connect Now</button>
          </>
        )}

        {step === 'error' && (
          <>
            <div style={styles.errorIcon}>✗</div>
            <div style={styles.heading}>Payment failed</div>
            <div style={styles.hint}>{error}</div>
            <button style={styles.btn} onClick={() => { setStep('select'); setError('') }}>Try Again</button>
          </>
        )}
      </div>

      <div style={styles.footer}>Powered by WifiPay · RXR PRIME LTD</div>
    </div>
  )
}

const styles = {
  page:        { minHeight:'100vh', background:'#ECEAE3', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  brand:       { textAlign:'center', marginBottom:20 },
  brandName:   { fontSize:22, fontWeight:800, color:'#1C2B45' },
  brandTag:    { fontSize:10, letterSpacing:2, color:'#8C9BAD', textTransform:'uppercase', marginTop:4 },
  card:        { width:'100%', maxWidth:360, background:'#fff', borderRadius:10, padding:'24px 20px', boxShadow:'0 2px 16px rgba(28,43,69,.08)' },
  heading:     { fontSize:16, fontWeight:700, color:'#1C2B45', marginBottom:4 },
  subheading:  { fontSize:12, color:'#8C9BAD', marginBottom:16 },
  hint:        { fontSize:12, color:'#8C9BAD', margin:'12px 0', lineHeight:1.5 },
  error:       { fontSize:12, color:'#A02828', background:'#FEF2F2', borderLeft:'3px solid #CB3030', padding:'8px 12px', borderRadius:'0 5px 5px 0', marginBottom:14 },
  pkgGrid:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, margin:'12px 0' },
  pkg:         { padding:'10px 11px', border:'1.5px solid #EEF0F4', borderRadius:7, cursor:'pointer', background:'#FAFBFD' },
  pkgSelected: { borderColor:'#BF7E08', background:'#FFFBF2' },
  pkgName:     { fontSize:10, fontWeight:700, color:'#8C9BAD', textTransform:'uppercase', letterSpacing:.5, marginBottom:5 },
  pkgPrice:    { fontSize:18, fontWeight:800, color:'#BF7E08' },
  pkgMeta:     { fontSize:10, color:'#B4BBC6', marginTop:3 },
  input:       { width:'100%', padding:'12px 14px', border:'1.5px solid #D8DDEA', borderRadius:7, fontSize:16, color:'#1C2B45', outline:'none', marginBottom:10 },
  btn:         { display:'block', width:'100%', padding:13, background:'#1C2B45', color:'#fff', fontSize:14, fontWeight:700, border:'none', borderRadius:7, cursor:'pointer', marginBottom:8 },
  btnBack:     { display:'block', width:'100%', padding:11, background:'transparent', border:'1.5px solid #D8DDEA', borderRadius:7, color:'#8C9BAD', fontSize:13, fontWeight:600, cursor:'pointer' },
  spinner:     { width:36, height:36, border:'3px solid #EEF0F4', borderTop:'3px solid #BF7E08', borderRadius:'50%', margin:'20px auto', animation:'spin 1s linear infinite' },
  successIcon: { fontSize:40, textAlign:'center', color:'#2D7A4F', margin:'8px 0 12px' },
  errorIcon:   { fontSize:40, textAlign:'center', color:'#CB3030', margin:'8px 0 12px' },
  footer:      { marginTop:20, fontSize:10, color:'#A8B4BE', textAlign:'center' },
}
