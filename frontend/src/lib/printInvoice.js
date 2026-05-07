import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'

function fmt(n) {
  return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function buildInvoiceText(deal, lead) {
  const invoiceNo = `INV-${String(deal._id).slice(-6).toUpperCase()}`
  const today     = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const renewal   = deal.renewalDate
    ? new Date(deal.renewalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  const lines = (deal.items || []).map((it) => {
    const lineTotal   = (it.unitPrice || 0) * (it.qty || 1)
    const lineNet     = lineTotal - lineTotal * ((it.lineDiscount || 0) / 100)
    return `  • ${it.name} (${it.qty || 1} × ₹${fmt(it.unitPrice)}${it.lineDiscount > 0 ? ` − ${it.lineDiscount}%` : ''}) = ₹${fmt(lineNet)}`
  }).join('\n')

  let text = `${invoiceNo}\n`
  text += `Date: ${today}\n`
  text += `Bill to: ${lead?.businessName || '—'}`
  if (lead?.clientPOC) text += ` (${lead.clientPOC})`
  if (lead?.phone)     text += `\nPhone: ${lead.phone}`
  text += `\n\nItems:\n${lines}`
  text += `\n\nSubtotal: ₹${fmt(deal.subtotal)}`
  if ((deal.discountAmount || 0) > 0) text += `\nDiscount: − ₹${fmt(deal.discountAmount)}`
  if ((deal.taxAmount || 0) > 0)      text += `\nGST (${deal.taxRate}%): + ₹${fmt(deal.taxAmount)}`
  text += `\nTotal: ₹${fmt(deal.totalAmount)}`
  if (renewal) text += `\nRenewal: ${renewal}`
  if (deal.notes) text += `\nNotes: ${deal.notes}`
  return text
}

function buildInvoiceHtml(deal, lead) {
  const invoiceNo = `INV-${String(deal._id).slice(-6).toUpperCase()}`
  const today     = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const renewal   = deal.renewalDate
    ? new Date(deal.renewalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  const itemRows = (deal.items || []).map((it) => {
    const lineTotal  = (it.unitPrice || 0) * (it.qty || 1)
    const lineNet    = lineTotal - lineTotal * ((it.lineDiscount || 0) / 100)
    return `<tr>
      <td>${it.name}</td>
      <td class="num">₹ ${fmt(it.unitPrice)}</td>
      <td class="num">${it.qty || 1}</td>
      <td class="num">${it.lineDiscount || 0}%</td>
      <td class="num">₹ ${fmt(lineNet)}</td>
    </tr>`
  }).join('')

  const discLabel = deal.discountType === 'flat'
    ? 'Deal discount (₹ flat)'
    : `Deal discount (${deal.discountValue || 0}%)`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${invoiceNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 48px 56px; }
    h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .header-right { text-align: right; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 2px; }
    .value { font-size: 14px; font-weight: 500; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #999; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; text-align: left; padding: 0 8px 8px 0; border-bottom: 1px solid #e5e5e5; }
    th.num, td.num { text-align: right; }
    td { padding: 10px 8px 10px 0; border-bottom: 1px solid #f0f0f0; }
    .totals { margin-top: 20px; margin-left: auto; width: 260px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #555; }
    .totals-row.discount { color: #d97706; }
    .totals-row.total { border-top: 2px solid #111; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 700; color: #000; }
    .footer { margin-top: 56px; border-top: 1px solid #e5e5e5; padding-top: 16px; font-size: 11px; color: #aaa; text-align: center; }
    @media print { body { padding: 24px 32px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="label">Invoice</div>
      <h1>${invoiceNo}</h1>
      <div style="margin-top:8px;color:#555;font-size:12px;">Date: ${today}</div>
    </div>
    <div class="header-right">
      <div class="label">Bill to</div>
      <div class="value">${lead?.businessName || '—'}</div>
      ${lead?.clientPOC ? `<div style="color:#666;font-size:12px;margin-top:2px;">${lead.clientPOC}</div>` : ''}
      ${lead?.phone     ? `<div style="color:#666;font-size:12px;">${lead.phone}</div>` : ''}
      ${lead?.email     ? `<div style="color:#666;font-size:12px;">${lead.email}</div>` : ''}
    </div>
  </div>
  <div class="section">
    <div class="section-title">Line Items</div>
    <table>
      <thead><tr>
        <th>Description</th><th class="num">Unit Price</th><th class="num">Qty</th><th class="num">Disc</th><th class="num">Amount</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>
  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>₹ ${fmt(deal.subtotal)}</span></div>
    ${(deal.discountAmount || 0) > 0 ? `<div class="totals-row discount"><span>${discLabel}</span><span>− ₹ ${fmt(deal.discountAmount)}</span></div>` : ''}
    ${(deal.taxAmount || 0) > 0 ? `<div class="totals-row"><span>GST (${deal.taxRate || 0}%)</span><span>+ ₹ ${fmt(deal.taxAmount)}</span></div>` : ''}
    <div class="totals-row total"><span>Total</span><span>₹ ${fmt(deal.totalAmount)}</span></div>
  </div>
  ${deal.renewalDate ? `<div style="margin-top:32px;font-size:12px;color:#666;"><strong>Renewal date:</strong> ${renewal}</div>` : ''}
  ${deal.notes ? `<div style="margin-top:16px;font-size:12px;color:#666;"><strong>Notes:</strong> ${deal.notes}</div>` : ''}
  <div class="footer">Generated via Nexus CRM · ${today}</div>
</body>
</html>`
}

export async function printInvoice(deal, lead) {
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({
        title:       `Invoice INV-${String(deal._id).slice(-6).toUpperCase()}`,
        text:        buildInvoiceText(deal, lead),
        dialogTitle: 'Share Invoice',
      })
    } catch {
      // User dismissed share sheet — no action needed
    }
    return
  }

  // Web: open print dialog
  const w = window.open('', '_blank', 'width=900,height=700')
  w.document.write(buildInvoiceHtml(deal, lead))
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 400)
}
