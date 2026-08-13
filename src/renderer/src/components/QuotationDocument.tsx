import type { ItemColumnDefinition, QuotationItem } from '../../../shared/types'
import type { PrintField, QuotationDocumentModel } from '../../../shared/document'
import { kitchenGroupLabel } from '../../../shared/metadata'
import { Fragment } from 'react'
import './QuotationDocument.css'

type Props = {
  model: QuotationDocumentModel
}

type ItemGroup = {
  category: string
  items: Array<{ item: QuotationItem; index: number }>
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

function fieldMap(fields: PrintField[]): Map<string, string> {
  return new Map(fields.map((field) => [field.fieldKey, field.value]))
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
    if (typeof path !== 'string' || !path.trim()) {
      return <span className="qd-image-placeholder" />
    }
    const src = assetDataUrls[path]
    if (!src) return <span className="qd-image-placeholder" />
    return <img className="qd-item-thumb" src={src} alt="" />
  }

  if (column.columnKey === 'description') {
    const description = String(item.columnValues?.description ?? '—')
    const specs = String(item.columnValues?.specs ?? '').trim()
    const subtype = String(item.columnValues?.subtype ?? '').trim()
    return (
      <div className="qd-desc">
        <div>
          {description}
          {subtype ? ` — ${subtype}` : ''}
        </div>
        {specs ? <div className="qd-specs">{specs}</div> : null}
      </div>
    )
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

/** Category headers renamed by the selected material + finish (like the sheet). */
function displayCategory(
  category: string,
  baseMaterial: string | undefined,
  finish: string | undefined
): string {
  if (/SHUTTER/i.test(category) && !/ROLLING/i.test(category)) {
    return kitchenGroupLabel('shutter', baseMaterial, finish)
  }
  if (/CABINET/i.test(category)) {
    return kitchenGroupLabel('cabinet', baseMaterial, finish)
  }
  if (/(TANDEM|TENDEM)/i.test(category)) {
    return kitchenGroupLabel('drawer', baseMaterial, finish)
  }
  return category
}

function cleanFieldValue(value: string | undefined): string | undefined {
  return value && value !== '—' ? value : undefined
}

function groupItems(items: QuotationItem[]): ItemGroup[] {
  const groups: ItemGroup[] = []
  const indexByCategory = new Map<string, number>()

  items.forEach((item, index) => {
    const category = String(item.columnValues?.category ?? '').trim() || 'Items'
    let groupIndex = indexByCategory.get(category)
    if (groupIndex == null) {
      groupIndex = groups.length
      indexByCategory.set(category, groupIndex)
      groups.push({ category, items: [] })
    }
    groups[groupIndex].items.push({ item, index })
  })

  return groups
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
    letterheadDataUrl,
    bankQrDataUrl,
    assetDataUrls
  } = model
  const currency = quotation.currency || 'INR'
  const assets = assetDataUrls ?? {}
  const fields = fieldMap(printFields)
  const baseMaterial = cleanFieldValue(fields.get('baseMaterial'))
  const finish = cleanFieldValue(fields.get('finish'))
  const companyName = company?.name ?? 'Our Company'

  const salesKeys = ['salesExecutive', 'designerName', 'designerContact', 'designerEmail']
  const optionKeys = ['quoteType', 'baseMaterial', 'finish']
  const otherFields = printFields.filter(
    (field) => !salesKeys.includes(field.fieldKey) && !optionKeys.includes(field.fieldKey)
  )

  const companyLines = [
    company?.address,
    [company?.phone, company?.email].filter(Boolean).join(' · ') || null,
    company?.website,
    company?.taxRegNumber ? `Tax: ${company.taxRegNumber}` : null,
    company?.panNumber ? `PAN: ${company.panNumber}` : null
  ].filter(Boolean) as string[]

  const customerAddress = customer?.billingAddress || customer?.address || null
  const groups = groupItems(quotation.items)
  const colSpan = printColumns.length + 1

  const coverIntro = [
    `${companyName}, one of Nashik's leading modular kitchen brands and a trusted interior solutions company, brings years of industry expertise backed by a strong network of partners and associates.`,
    'We are recognized among the finest modular kitchen manufacturers in the region, known for adhering to stringent quality standards and delivering high-performance, made-to-measure kitchen solutions.',
    'Our modern manufacturing setup, equipped with precision machinery, ensures exceptional accuracy, consistency, and timely execution for every project we undertake.',
    'We are proud manufacturers of modular kitchens in BWP Marine Ply and HDFHMR, with finishes including Laminate, Back Painted Acrylic, Back Painted Glass, Acrymica, Ceramic, PU and PVC — engineered with premium hardware from Hettich, Blum, Hafele, Sleek and Ebco to meet diverse design requirements.',
    'Every kitchen is built with waterproof, antiskid and soft-close detailing, reflecting our commitment to quality, durability and everyday convenience.',
    'We assure you of our best quality, competitive pricing, and professional service.',
    'We look forward to building a long-term association with you and request the opportunity to serve your project.'
  ]

  return (
    <div className="qd-root">
      {/* PAGE 1: cover letter — To + customer at top, company introduction below */}
      <article className="qd-page qd-cover">
        <div className="qd-watermark" aria-hidden>
          {company?.name ?? 'QUOTATION'}
        </div>

        {letterheadDataUrl ? (
          <img className="qd-letterhead" src={letterheadDataUrl} alt="" />
        ) : (
          <header className="qd-header">
            <div className="qd-brand">
              {logoDataUrl && <img className="qd-logo" src={logoDataUrl} alt="" />}
              <div>
                <p className="qd-company-name">{companyName}</p>
                {companyLines.length > 0 && <p className="qd-muted">{companyLines.join('\n')}</p>}
              </div>
            </div>
          </header>
        )}

        <div className="qd-cover-to">
          <div className="qd-to-label">To,</div>
          <div className="qd-to-name">{customer?.name ?? quotation.customerName ?? '—'}</div>
          {customer?.phone && <div className="qd-to-contact">{customer.phone}</div>}
          {customerAddress && <div className="qd-to-contact">{customerAddress}</div>}
        </div>

        <div className="qd-cover-intro">
          {coverIntro.map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </div>

        <footer className="qd-cover-footer">
          <div className="qd-cover-quote-line">
            Quote No. : {quotation.quotationNumber} &nbsp;/&nbsp; Date : {formatDate(quotation.date)}
          </div>
          <div className="qd-cover-company">
            <strong>{companyName}</strong>
            {companyLines.length > 0 && <div>{companyLines.join(' · ')}</div>}
          </div>
          <div className="qd-cover-tagline">Innovative Concept | Quality Product | Fair Price</div>
        </footer>
      </article>

      {/* PAGE 2+: the quotation document */}
      <article className="qd-page">
        <div className="qd-watermark" aria-hidden>
          {company?.name ?? 'QUOTATION'}
        </div>

        {letterheadDataUrl && <img className="qd-letterhead" src={letterheadDataUrl} alt="" />}

        <header className="qd-header">
          <div className="qd-brand">
            {!letterheadDataUrl && logoDataUrl && (
              <img className="qd-logo" src={logoDataUrl} alt="" />
            )}
            <div>
              <p className="qd-company-name">{companyName}</p>
              {letterheadDataUrl ? (
                company?.taxRegNumber && <p className="qd-muted">Tax: {company.taxRegNumber}</p>
              ) : (
                companyLines.length > 0 && <p className="qd-muted">{companyLines.join('\n')}</p>
              )}
            </div>
          </div>
          <div className="qd-meta">
            <h1>QUOTATION</h1>
            <p>
              <strong>Quote No.</strong> {quotation.quotationNumber}
              {quotation.revisionNumber > 0 ? ` (R${quotation.revisionNumber})` : ''}
            </p>
            <p>
              <strong>Date</strong> {formatDate(quotation.date)}
            </p>
          </div>
        </header>

        <div className="qd-grid-2">
          <section className="qd-block">
            <h2>Customer Details</h2>
            <dl className="qd-dl">
              <div>
                <dt>Name</dt>
                <dd>{customer?.name ?? quotation.customerName ?? '—'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{customer?.email || '—'}</dd>
              </div>
              <div>
                <dt>Contact No</dt>
                <dd>{customer?.phone || '—'}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{customerAddress || '—'}</dd>
              </div>
            </dl>
          </section>
          <section className="qd-block">
            <h2>Sales Representative Details</h2>
            <dl className="qd-dl">
              <div>
                <dt>Sales Executive</dt>
                <dd>{fields.get('salesExecutive') || '—'}</dd>
              </div>
              <div>
                <dt>Designer</dt>
                <dd>{fields.get('designerName') || '—'}</dd>
              </div>
              <div>
                <dt>Contact No</dt>
                <dd>{fields.get('designerContact') || '—'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{fields.get('designerEmail') || company?.email || '—'}</dd>
              </div>
            </dl>
          </section>
        </div>

        {(fields.get('quoteType') || fields.get('baseMaterial') || fields.get('finish')) && (
          <div className="qd-options">
            {fields.get('quoteType') && (
              <div>
                <span>Quotation Type</span>
                <strong>{fields.get('quoteType')}</strong>
              </div>
            )}
            {fields.get('baseMaterial') && (
              <div>
                <span>Base Material</span>
                <strong>{fields.get('baseMaterial')}</strong>
              </div>
            )}
            {fields.get('finish') && (
              <div>
                <span>Finish</span>
                <strong>{fields.get('finish')}</strong>
              </div>
            )}
          </div>
        )}

        {otherFields.length > 0 && (
          <div className="qd-fields">
            {otherFields.map((field) => (
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
              <th style={{ width: '2.4rem' }}>Sr.No.</th>
              {printColumns.map((column) => (
                <th
                  key={column.id}
                  className={isNumericColumn(column) ? 'qd-num' : undefined}
                  style={column.width ? { width: `${column.width}px` } : undefined}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quotation.items.length === 0 ? (
              <tr>
                <td colSpan={colSpan}>No line items</td>
              </tr>
            ) : (
              groups.map((group) => (
                <Fragment key={group.category}>
                  <tr className="qd-category-row">
                    <td colSpan={colSpan}>
                      {displayCategory(group.category, baseMaterial, finish)}
                    </td>
                  </tr>
                  {group.items.map(({ item }, localIndex) => (
                    <tr key={item.id}>
                      <td>{localIndex + 1}</td>
                      {printColumns.map((column) => (
                        <td
                          key={column.id}
                          className={isNumericColumn(column) ? 'qd-num' : undefined}
                        >
                          {renderItemCell(item, column, currency, assets)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
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
              <span>Less discount</span>
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
            <span>Total Amount</span>
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
            <h2>Terms and Conditions</h2>
            <ol className="qd-terms-list">
              {terms.map((term) => (
                <li key={term.title}>
                  {term.body}
                </li>
              ))}
            </ol>
          </section>
        )}

        <footer className="qd-footer">
          <div className="qd-bank">
            {(company?.bankDetails || company?.footer) && (
              <>
                {company.bankDetails && (
                  <>
                    <h2>Bank Details</h2>
                    <div className="qd-bank-flex">
                      <p className="qd-muted">{company.bankDetails}</p>
                      {bankQrDataUrl && (
                        <img className="qd-bank-qr" src={bankQrDataUrl} alt="Payment QR" />
                      )}
                    </div>
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
