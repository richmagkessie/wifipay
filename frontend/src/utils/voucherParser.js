// Matches 6-20 char voucher codes: uppercase letters + digits only
const CODE_RE = /\b[A-Z0-9]{6,20}\b/g

// Words to exclude that look like codes but aren't
const EXCLUDE = new Set([
  'BELORA','CONNECT','DAILY','WEEKLY','VOUCHER','INTERNET',
  'ACCESS','GHANA','CEDIS','VALID','HOURS','MINUTES','WIFI',
  'HOTSPOT','NETWORK','UNLIMITED','SPEED','MBPS','GHS',
])

function looksLikeCode(s) {
  if (!(/[0-9]/.test(s) && /[A-Z]/.test(s))) return false  // must mix letters + digits
  if (/^[0-9A-F]+$/.test(s)) return false                   // all-hex = UUID/hash fragment
  if (EXCLUDE.has(s)) return false
  return true
}

function extractCodes(text) {
  const raw = text.toUpperCase().match(CODE_RE) || []
  return [...new Set(raw.filter(looksLikeCode))]
}

// ─── TXT / plain text ─────────────────────────────────────────────────────────
export function parseTxt(text) {
  // Try line-by-line first (our BELORA format: one code per line)
  const lines = text.trim().split(/\r?\n/).map(l => l.trim().toUpperCase()).filter(Boolean)
  const cleanLines = lines.filter(l => /^[A-Z0-9]{6,20}$/.test(l) && looksLikeCode(l))
  if (cleanLines.length > lines.length * 0.4) return cleanLines   // majority are clean codes
  return extractCodes(text)                                         // fallback: regex scan
}

// ─── CSV ──────────────────────────────────────────────────────────────────────
export function parseCsv(text) {
  const rows = text.trim().split(/\r?\n/)
  if (rows.length < 2) return extractCodes(text)

  // Detect header row
  const header = rows[0].toLowerCase().replace(/"/g, '').split(',').map(h => h.trim())
  const nameIdx = header.indexOf('name')  // MikroTik CSV: first column is "name"
  const codeIdx = nameIdx >= 0 ? nameIdx : 0

  const codes = rows.slice(1).map(row => {
    const cols = row.split(',')
    return (cols[codeIdx] || '').replace(/"/g, '').trim().toUpperCase()
  }).filter(c => /^[A-Z0-9]{6,20}$/.test(c) && looksLikeCode(c))

  return [...new Set(codes)]
}

// ─── PDF ──────────────────────────────────────────────────────────────────────
export async function parsePdf(arrayBuffer) {
  const pdfjsLib = await import('pdfjs-dist')

  // Point worker to the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).href

  const pdf   = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let   allText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i)
    const content = await page.getTextContent()
    allText += content.items.map(item => item.str).join(' ') + '\n'
  }

  return extractCodes(allText)
}

// ─── Main entry ───────────────────────────────────────────────────────────────
export async function parseVoucherFile(file) {
  const name = file.name.toLowerCase()

  if (name.endsWith('.pdf')) {
    const buf = await file.arrayBuffer()
    return parsePdf(buf)
  }

  const text = await file.text()

  if (name.endsWith('.csv')) return parseCsv(text)

  return parseTxt(text)   // .txt, .log, or anything else
}
