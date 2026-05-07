import ExcelJS from 'exceljs'
import { Readable } from 'stream'
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

export const downloadSample = async (req, res) => {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Leads')

  ws.columns = COLUMNS.map(col => ({ header: col, key: col }))

  // Set column widths for readability
  ws.getColumn(1).width = 25 // Business Name
  ws.getColumn(2).width = 18 // Phone
  ws.getColumn(3).width = 28 // Email
  ws.getColumn(4).width = 18 // Client POC
  ws.getColumn(5).width = 18 // Internal POC
  ws.getColumn(6).width = 16 // Zone
  ws.getColumn(7).width = 10 // Priority
  ws.getColumn(8).width = 10 // Source
  ws.getColumn(9).width = 22 // Outcome
  ws.getColumn(10).width = 15 // Follow-up Date
  ws.getColumn(11).width = 14 // Follow-up Time
  ws.getColumn(12).width = 35 // Maps Link
  ws.getColumn(13).width = 30 // Address
  ws.getColumn(14).width = 30 // Notes

  // ── Sheet 1: Sample leads ──────────────────────────────────────
  const sampleRow = {
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
  }
  ws.addRow(sampleRow)

  // ── Sheet 2: Valid Values reference ───────────────────────────
  const wsRef = wb.addWorksheet('Valid Values')
  wsRef.columns = [
    { header: 'Column', key: 'Column', width: 18 },
    { header: 'Valid Values / Format', key: 'Valid Values / Format', width: 65 },
    { header: 'Default', key: 'Default', width: 14 },
  ]

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
  wsRef.addRows(refRows)

  const buf = await wb.xlsx.writeBuffer()
  res.setHeader('Content-Disposition', 'attachment; filename="crm-leads-sample.xlsx"')
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.send(Buffer.from(buf))
}

export const bulkUpload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  let rows = []
  try {
    const wb = new ExcelJS.Workbook()
    const isCsv = req.file.originalname.toLowerCase().endsWith('.csv')
    
    if (isCsv) {
      const stream = Readable.from(req.file.buffer)
      await wb.csv.read(stream)
    } else {
      await wb.xlsx.load(req.file.buffer)
    }

    const ws = wb.worksheets[0] // always read first sheet
    if (!ws) throw new Error("No worksheets found")

    const headers = []
    ws.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber] = cell.value
    })

    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // skip header
      const rowData = {}
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        let val = cell.value
        // Handle formulas and rich text
        if (val && typeof val === 'object') {
          if (val.result !== undefined) val = val.result
          else if (val.richText) val = val.richText.map(t => t.text).join('')
        }
        if (headers[colNumber]) {
          rowData[headers[colNumber]] = val
        }
      })
      rows.push(rowData)
    })
  } catch (err) {
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
