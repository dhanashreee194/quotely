import type { ItemColumnDefinition, QuotationItem } from '../../../shared/types'
import type { QuotationDocumentModel } from '../../../shared/document'
import './QuotationDocument.css'

type Props = {
  model: QuotationDocumentModel
}

function formatMoney(value: number, currency: string): string {
  const amount = Number.isFinite(value) ? value.toFixed(2) : '0.00'
  return currency ? `${currency} ${amount}` : amount
}

function formatPlain(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function formatDate(iso: string): string {
  const day = iso.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return iso
  const [y, m, d] = day.split('-')
  return `${d}/${m}/${y}`
}

function getItemCellValue(
  item: QuotationItem,
  column: ItemColumnDefinition,
  currency: string
): string {
  switch (column.columnKey) {
    case 'qty':
      return formatPlain(item.qty)
    case 'rate':
      return formatMoney(item.rate, currency)
    case 'amount':
      return formatMoney(item.amount, currency)
    case 'discount':
      return item.discountType === 'percentage'
        ? `${formatPlain(item.discount)}%`
        : formatMoney(item.discount, currency)
    case 'taxPercent':
      return `${formatPlain(item.taxPercent)}%`
    default: {
      const raw = item.columnValues?.[column.columnKey]
      if (raw == null || raw === '') return '—'
      if (typeof raw === 'number') {
        if (column.dataType === 'currency') return formatMoney(raw, currency)
        if (column.dataType === 'percentage') return `${formatPlain(raw)}%`
        return formatPlain(raw)
      }
      return String(raw)
    }
  }
}

function renderItemCell(
  item: QuotationItem,
  column: ItemColumnDefinition,
  currency: string,
  assetDataUrls: Record<string, string>
): React.ReactNode {
  if (column.dataType === 'image') {
    const path = item.columnValues?.[column.columnKey]
    if (typeof path !== 'string' || !path.trim()) return '—'
    const src = assetDataUrls[path]
    if (!src) return '—'
    return <img className="qd-item-thumb" src={src} alt="" />
  }
  return getItemCellValue(item, column, currency)
}

function isNumericColumn(column: ItemColumnDefinition): boolean {
  return (
    column.dataType === 'number' ||
    column.dataType === 'currency' ||
    column.dataType === 'percentage' ||
    column.columnKey === 'qty' ||
    column.columnKey === 'rate' ||
    column.columnKey === 'amount' ||
    column.columnKey === 'discount'
  )
}

export default function QuotationDocument({ model }: Props): React.JSX.Element {
  const {
    quotation,
    company,
    customer,
    printFields,
    printColumns,
    terms,
    logoDataUrl,
    signatureDataUrl,
    assetDataUrls
  } = model
  const currency = quotation.currency || ''
  const assets = assetDataUrls ?? {}

  const companyLines = [
    company?.address,
    [company?.phone, company?.email].filter(Boolean).join(' · ') || null,
    company?.website,
    company?.taxRegNumber ? `Tax: ${company.taxRegNumber}` : null,
    company?.panNumber ? `PAN: ${company.panNumber}` : null
  ].filter(Boolean) as string[]

  const customerAddress = customer?.billingAddress || customer?.address || null

  return (
    <div className="qd-root">
      <article className="qd-page">
        <header className="qd-header">
          <div className="qd-brand">
            {logoDataUrl && <img className="qd-logo" src={logoDataUrl} alt="" />}
            <div>
              <p className="qd-company-name">{company?.name ?? 'Company'}</p>
              {companyLines.length > 0 && (
                <p className="qd-muted">{companyLines.join('\n')}</p>
              )}
            </div>
          </div>
          <div className="qd-meta">
            <h1>QUOTATION</h1>
            <p>
              <strong>No.</strong> {quotation.quotationNumber}
              {quotation.revisionNumber > 0 ? ` (R${quotation.revisionNumber})` : ''}
            </p>
            <p>
              <strong>Date</strong> {formatDate(quotation.date)}
            </p>
          </div>
        </header>

        <div className="qd-grid-2">
          <section className="qd-block">
            <h2>Bill to</h2>
            <p>
              <strong>{customer?.name ?? quotation.customerName ?? '—'}</strong>
            </p>
            {customer?.companyName && <p className="qd-muted">{customer.companyName}</p>}
            {customerAddress && <p className="qd-muted">{customerAddress}</p>}
            {customer && (customer.contactPerson || customer.phone || customer.email) && (
              <p className="qd-muted">
                {[customer.contactPerson, customer.phone, customer.email]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            {customer?.taxNumber && <p className="qd-muted">Tax: {customer.taxNumber}</p>}
          </section>
          <section className="qd-block">
            <h2>Details</h2>
            <p>
              <strong>Status</strong> {quotation.status}
            </p>
            <p>
              <strong>Currency</strong> {currency || '—'}
            </p>
            {quotation.templateName && (
              <p>
                <strong>Template</strong> {quotation.templateName}
              </p>
            )}
          </section>
        </div>

        {printFields.length > 0 && (
          <div className="qd-fields">
            {printFields.map((field) => (
              <div className="qd-field" key={field.fieldKey}>
                <label>{field.label}</label>
                <div>{field.value}</div>
              </div>
            ))}
          </div>
        )}

        <table className="qd-table">
          <thead>
            <tr>
              <th style={{ width: '2.5rem' }}>#</th>
              {printColumns.map((column) => (
                <th key={column.id} className={isNumericColumn(column) ? 'qd-num' : undefined}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quotation.items.length === 0 ? (
              <tr>
                <td colSpan={printColumns.length + 1}>No line items</td>
              </tr>
            ) : (
              quotation.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  {printColumns.map((column) => (
                    <td
                      key={column.id}
                      className={isNumericColumn(column) ? 'qd-num' : undefined}
                    >
                      {renderItemCell(item, column, currency, assets)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="qd-summary">
          <div className="qd-summary-row">
            <span>Subtotal</span>
            <span>{formatMoney(quotation.subtotal, currency)}</span>
          </div>
          {quotation.discountTotal > 0 && (
            <div className="qd-summary-row">
              <span>Discount</span>
              <span>−{formatMoney(quotation.discountTotal, currency)}</span>
            </div>
          )}
          {quotation.charges.map((charge) => (
            <div className="qd-summary-row" key={charge.id}>
              <span>
                {charge.name}
                {charge.type === 'percentage' ? ` (${formatPlain(charge.value)}%)` : ''}
              </span>
              <span>{formatMoney(charge.amount, currency)}</span>
            </div>
          ))}
          <div className="qd-summary-row total">
            <span>Grand total</span>
            <span>{formatMoney(quotation.grandTotal, currency)}</span>
          </div>
        </div>

        {quotation.notesCustomer && (
          <section className="qd-notes">
            <h2>Notes</h2>
            <p className="qd-muted">{quotation.notesCustomer}</p>
          </section>
        )}

        {terms.length > 0 && (
          <section className="qd-terms">
            <h2>Terms &amp; conditions</h2>
            {terms.map((term) => (
              <div className="qd-terms-item" key={term.title}>
                <h3>{term.title}</h3>
                <p>{term.body}</p>
              </div>
            ))}
          </section>
        )}

        <footer className="qd-footer">
          <div className="qd-bank">
            {(company?.bankDetails || company?.footer) && (
              <>
                {company.bankDetails && (
                  <>
                    <h2>Bank details</h2>
                    <p className="qd-muted">{company.bankDetails}</p>
                  </>
                )}
                {company.footer && <p className="qd-muted">{company.footer}</p>}
              </>
            )}
          </div>
          <div className="qd-signature">
            {signatureDataUrl && <img src={signatureDataUrl} alt="" />}
            <div className="qd-sign-line">
              {company?.authorizedSignatory || 'Authorized signatory'}
            </div>
          </div>
        </footer>
      </article>
    </div>
  )
}
