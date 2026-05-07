import XLSX from 'xlsx'
import Lead from '../models/Lead.js'
import Zone from '../models/Zone.js'
import Reminder from '../models/Reminder.js'

const VALID_PRIORITIES = ['P0', 'P1', 'P2', 'P3', 'P4']
const VALID_SOURCES    = ['call', 'mail', 'referral', 'walk-in', 'other']
const VALID_OUTCOMES   = [
  'fresh-lead', 'call-made', 'call-not-picked', 'follow-up-scheduled', 'demo-scheduled',
]

// Column order for the leads sheet
export const COLUMNS = [
  'Business Name',
  'Phone',
  'Email',
  'Client POC',
  'Internal POC',
  'Zone',
  'Priority',
  'Source',
  'Outcome',
  'Follow-up Date',
  'Follow-up Time',
  'Maps Link',
  'Address',
  'Notes',
]

export const downloadSample = (req, res) => {
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Sample leads ──────────────────────────────────────
  const sampleRows = [
    {
      'Business Name': 'Sharma Traders',
      'Phone':          '+91 98765 43210',
      'Email':          'sharma@traders.com',
      'Client POC':     'Rajesh Sharma',
      'Internal POC':   'Rahul (Sales)',
      'Zone':           'North Delhi',
      'Priority':       'P2',
      'Source':         'call',
      'Outcome':        'fresh-lead',
      'Follow-up Date': '2026-05-20',
      'Follow-up Time': '10:00',
      'Maps Link':      'https://maps.google.com/?q=...',
      'Address':        '12 Main Market, Karol Bagh',
      'Notes':          '',
    },
  ]

  const ws = XLSX.utils.json_to_sheet(sampleRows, { header: COLUMNS })

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 25 }, // Business Name
    { wch: 18 }, // Phone
    { wch: 28 }, // Email
    { wch: 18 }, // Client POC
    { wch: 18 }, // Internal POC
    { wch: 16 }, // Zone
    { wch: 10 }, // Priority
    { wch: 10 }, // Source
    { wch: 22 }, // Outcome
    { wch: 15 }, // Follow-up Date
    { wch: 14 }, // Follow-up Time
    { wch: 35 }, // Maps Link
    { wch: 30 }, // Address
    { wch: 30 }, // Notes
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Leads')

  // ── Sheet 2: Valid Values reference ───────────────────────────
  const refRows = [
    { Column: 'Business Name', 'Valid Values / Format': '(required) Any text', Default: '' },
    { Column: 'Phone',         'Valid Values / Format': 'Include country code: +91 98765 43210', Default: '' },
    { Column: 'Email',         'Valid Values / Format': 'valid@email.com', Default: '' },
    { Column: 'Client POC',    'Valid Values / Format': 'Any text', Default: '' },
    { Column: 'Internal POC',  'Valid Values / Format': 'Must match a Sales Rep name in Settings', Default: '' },
    { Column: 'Zone',          'Valid Values / Format': 'Must match a Zone name in Settings (exact, case-insensitive)', Default: '' },
    { Column: 'Priority',      'Valid Values / Format': 'P0 · P1 · P2 · P3 · P4', Default: 'P4' },
    { Column: 'Source',        'Valid Values / Format': 'call · mail · referral · walk-in · other', Default: 'call' },
    { Column: 'Outcome',       'Valid Values / Format': 'fresh-lead · call-made · call-not-picked · follow-up-scheduled · demo-scheduled', Default: 'fresh-lead' },
    { Column: 'Follow-up Date','Valid Values / Format': 'YYYY-MM-DD (e.g. 2026-05-20)', Default: '' },
    { Column: 'Follow-up Time','Valid Values / Format': 'HH:MM (e.g. 10:00 or 14:30)', Default: '' },
    { Column: 'Maps Link',     'Valid Values / Format': 'Full URL', Default: '' },
    { Column: 'Address',       'Valid Values / Format': 'Any text', Default: '' },
    { Column: 'Notes',         'Valid Values / Format': 'Any text', Default: '' },
  ]

  const wsRef = XLSX.utils.json_to_sheet(refRows, { header: ['Column', 'Valid Values / Format', 'Default'] })
  wsRef['!cols'] = [{ wch: 18 }, { wch: 65 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsRef, 'Valid Values')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  res.setHeader('Content-Disposition', 'attachment; filename="crm-leads-sample.xlsx"')
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.send(buf)
}

export const bulkUpload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  let rows
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true })
    const ws = wb.Sheets[wb.SheetNames[0]]  // always read first sheet
    rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
  } catch {
    return res.status(400).json({ error: 'Could not parse file. Upload a valid .xlsx or .csv file.' })
  }

  if (!rows.length) return res.status(400).json({ error: 'File is empty or has no data rows.' })

  // Pre-load zones for name → id lookup
  const zones = await Zone.find().lean()
  const zoneMap = {}
  zones.forEach((z) => { zoneMap[z.name.toLowerCase()] = z._id })

  const created = []
  const errors  = []

  for (let i = 0; i < rows.length; i++) {
    const row    = rows[i]
    const rowNum = i + 2   // +1 for 1-index, +1 for header row
    const rowErrors = []

    // ── Business Name (required) ──
    const businessName = String(row['Business Name'] ?? '').trim()
    if (!businessName) rowErrors.push('Business Name is required')

    // ── Priority (default P4) ──
    const priority = String(row['Priority'] ?? '').trim().toUpperCase() || 'P4'
    if (!VALID_PRIORITIES.includes(priority)) {
      rowErrors.push(`Priority must be one of P0–P4 (got "${row['Priority']}")`)
    }

    // ── Source (default call) ──
    const source = String(row['Source'] ?? '').trim().toLowerCase() || 'call'
    if (!VALID_SOURCES.includes(source)) {
      rowErrors.push(`Source must be one of: call, mail, referral, walk-in, other (got "${row['Source']}")`)
    }

    // ── Outcome (default fresh-lead) ──
    const rawOutcome = String(row['Outcome'] ?? '').trim().toLowerCase() || 'fresh-lead'
    if (!VALID_OUTCOMES.includes(rawOutcome)) {
      rowErrors.push(`Outcome must be one of: ${VALID_OUTCOMES.join(', ')} (got "${row['Outcome']}")`)
    }

    // ── Zone (optional, must exist if provided) ──
    let zoneId
    const zoneName = String(row['Zone'] ?? '').trim()
    if (zoneName) {
      zoneId = zoneMap[zoneName.toLowerCase()]
      if (!zoneId) rowErrors.push(`Zone "${zoneName}" not found — add it in Settings first`)
    }

    // ── Follow-up Date (optional) ──
    let followUpDate
    const rawDate = row['Follow-up Date']
    if (rawDate) {
      const d = rawDate instanceof Date ? rawDate : new Date(rawDate)
      if (isNaN(d.getTime())) {
        rowErrors.push(`Follow-up Date "${rawDate}" is not valid — use YYYY-MM-DD format`)
      } else {
        followUpDate = d
      }
    }

    // ── Follow-up Time (optional, validate HH:MM format) ──
    const followUpTime = String(row['Follow-up Time'] ?? '').trim()
    if (followUpTime && !/^\d{1,2}:\d{2}$/.test(followUpTime)) {
      rowErrors.push(`Follow-up Time "${followUpTime}" is not valid — use HH:MM format (e.g. 10:00)`)
    }

    if (rowErrors.length) {
      errors.push({ row: rowNum, businessName: businessName || '(blank)', errors: rowErrors })
      continue
    }

    try {
      const lead = await Lead.create({
        businessName,
        phone:      String(row['Phone']      ?? '').trim(),
        email:      String(row['Email']      ?? '').trim().toLowerCase(),
        clientPOC:  String(row['Client POC'] ?? '').trim(),
        internalPOC:String(row['Internal POC'] ?? '').trim(),
        mapsLink:   String(row['Maps Link']  ?? '').trim(),
        address:    String(row['Address']    ?? '').trim(),
        notes:      String(row['Notes']      ?? '').trim(),
        priority,
        source,
        outcome: rawOutcome,
        followUpTime: followUpTime || undefined,
        ...(zoneId       && { zone: zoneId }),
        ...(followUpDate && { followUpDate }),
        stage: 'pre-sales',
      })

      if (followUpDate) {
        await Reminder.create({
          leadId: lead._id,
          reminderDate: followUpDate,
          reminderTime: followUpTime || undefined,
        })
      }

      created.push(lead._id)
    } catch (err) {
      errors.push({ row: rowNum, businessName, errors: [err.message] })
    }
  }

  res.json({
    total:   rows.length,
    created: created.length,
    failed:  errors.length,
    errors,
  })
}
