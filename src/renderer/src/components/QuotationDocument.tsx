import type { ItemColumnDefinition, QuotationItem } from '../../../shared/types'
import type { PrintField, QuotationDocumentModel } from '../../../shared/document'
import { roundMoney } from '../../../shared/calc'
import {
  INSTALLATION_RATE_PER_SQFT,
  isInstallationChargeName,
  isQuotationNoteField,
  kitchenGroupLabel,
  PRODUCT_SUBTYPES,
  plySquareFeet
} from '../../../shared/metadata'
import { Fragment } from 'react'
import {
  ABOUT_PAGE_ONE,
  ABOUT_PAGE_ONE_SLOGAN,
  ABOUT_TAGLINE,
  BILLING_TABLE_TERMS,
  MODULAR_KITCHEN_TERMS
} from './silexDocContent'
import SilexLetterhead from './SilexLetterhead'
import './QuotationDocument.css'

type Props = {
  model: QuotationDocumentModel
}

type ItemGroup = {
  category: string
  items: Array<{ item: QuotationItem; index: number }>
}

function formatPlain(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return roundMoney(value)
    .toFixed(2)
    .replace(/\.?0+$/, '')
}

function formatMoney(value: number, currency: string): string {
  const amount = Number.isFinite(value)
    ? roundMoney(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })
    : '0'
  return currency ? `${currency} ${amount}` : amount
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
    const subtypeRaw = String(item.columnValues?.subtype ?? '').trim()
    // Drawer brands (e.g. "Hettich") price the row but are not printed in the description.
    const subtype =
      subtypeRaw &&
      !PRODUCT_SUBTYPES.drawer.includes(subtypeRaw) &&
      !description.toLowerCase().includes(subtypeRaw.toLowerCase())
        ? subtypeRaw
        : ''
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
  return category.replace(/^SLEEK\s+/i, '')
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
    tableHeaders: headerOverrides,
    logoDataUrl,
    signatureDataUrl,
    headerBrandDataUrl,
    documentQrs,
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
  const noteFields = printFields.filter((field) => isQuotationNoteField(field.fieldKey, field.label))
  const otherFields = printFields.filter(
    (field) =>
      !salesKeys.includes(field.fieldKey) &&
      !optionKeys.includes(field.fieldKey) &&
      !isQuotationNoteField(field.fieldKey, field.label) &&
      field.value !== '—'
  )

  const companyLines = [
    company?.address,
    [company?.phone, company?.email].filter(Boolean).join(' · ') || null,
    company?.website,
    company?.panNumber ? `PAN: ${company.panNumber}` : null
  ].filter(Boolean) as string[]

  const customerAddress = customer?.billingAddress || customer?.address || null
  const groups = groupItems(quotation.items)
  const colSpan = printColumns.length + 1
  const printedNotes = noteFields.filter((field) => field.value && field.value !== '—')
  const storedInstallation = quotation.charges.find((charge) => isInstallationChargeName(charge.name))
  const otherCharges = quotation.charges.filter((charge) => !isInstallationChargeName(charge.name))
  const plySqft = plySquareFeet(
    quotation.items.map((item) => ({
      qty: item.qty,
      unit: String(item.columnValues?.unit ?? ''),
      category: String(item.columnValues?.category ?? '')
    }))
  )
  const installationAmount = storedInstallation
    ? storedInstallation.amount
    : roundMoney(plySqft * INSTALLATION_RATE_PER_SQFT)
  const displayedGrandTotal = storedInstallation
    ? quotation.grandTotal
    : roundMoney(quotation.grandTotal + installationAmount)

  const projectName = cleanFieldValue(fields.get('projectName'))

  const watermarkText = company?.name ?? 'QUOTATION'

  // Screen: one watermark per page block. Print: a single fixed copy (see .qd-print-watermark)
  // that Chromium repeats on every physical page, so long tables never miss it.
  const watermark = (
    <div className="qd-watermark qd-screen-only" aria-hidden>
      <span className="qd-watermark-text">{watermarkText}</span>
    </div>
  )

  // Same letterhead component everywhere: in-flow on screen, fixed (repeating) in print.
  const letterhead = (
    <>
      <SilexLetterhead logoDataUrl={headerBrandDataUrl ?? logoDataUrl} />
      <hr className="silex-letterhead-rule" />
    </>
  )
  const pageTop = <div className="qd-screen-only">{letterhead}</div>

  const quotationHeader = (
    <>
      {pageTop}
      <div className="qd-quote-title-block">
        <div className="qd-quote-title-left">
          <h1 className="qd-quote-brand">SILEX KITCHEN</h1>
        </div>
        <div className="qd-quote-title-right">
          <h1>QUOTATION</h1>
          <p>
            <strong>Quote No.</strong> {quotation.quotationNumber}
            {quotation.revisionNumber > 0 ? ` (R${quotation.revisionNumber})` : ''}
          </p>
          <p>
            <strong>Date</strong> {formatDate(quotation.date)}
          </p>
        </div>
      </div>
    </>
  )

  const pageFooter = (
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
  )

  return (
    <div className="qd-root">
      <div className="qd-print-watermark" aria-hidden>
        <span className="qd-watermark-text">{watermarkText}</span>
      </div>

      {/* PAGE 1: About Silex Kitchen — To block at top, company profile below */}
      <article className="qd-page qd-cover">
        {watermark}
        {pageTop}

        <div className="qd-about-title">
          <h1>ABOUT {companyName.toUpperCase()}</h1>
          <div className="qd-about-tagline">{ABOUT_TAGLINE}</div>
          <div className="qd-about-meta">
            QUOTE NO.: {quotation.quotationNumber}
            {projectName ? <> &nbsp;|&nbsp; PROJECT: {projectName}</> : null}
            &nbsp;|&nbsp; DATE: {formatDate(quotation.date)}
          </div>
        </div>

        <div className="qd-cover-to">
          <div className="qd-to-label">To</div>
          <div className="qd-to-name">{customer?.name ?? quotation.customerName ?? '—'}</div>
          {customer?.phone && <div className="qd-to-contact">Contact: {customer.phone}</div>}
          {customerAddress && (
            <div className="qd-to-contact">Project Location: {customerAddress}</div>
          )}
        </div>

        <div className="qd-cover-intro">
          {ABOUT_PAGE_ONE.map((section, index) => (
            <div key={section.heading ?? index}>
              {section.heading && <h2 className="qd-about-heading">{section.heading}</h2>}
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
              {section.bullets && (
                <ul className="qd-about-list">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="qd-about-page-one-slogan">{ABOUT_PAGE_ONE_SLOGAN}</div>

        {pageFooter}
      </article>

      {/* Quotation document */}
      <article className="qd-page">
        {watermark}
        {quotationHeader}

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
              <th style={{ width: '2.4rem' }}>{headerOverrides?.srNo ?? 'Sr.No.'}</th>
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
                  <tr
                    className={
                      /CABINET/i.test(displayCategory(group.category, baseMaterial, finish))
                        ? 'qd-category-row qd-category-break'
                        : 'qd-category-row'
                    }
                  >
                    <td colSpan={Math.min(4, colSpan)}>
                      {headerOverrides?.[`category:${group.category}`] ??
                        displayCategory(group.category, baseMaterial, finish)}
                    </td>
                    {colSpan > 4 ? <td colSpan={colSpan - 4} aria-hidden /> : null}
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

        <div className="qd-tail">
          <div className="qd-summary">
            <div className="qd-summary-row">
              <span>Subtotal</span>
              <span>{formatMoney(quotation.subtotal, currency)}</span>
            </div>
            {quotation.discountTotal > 0 && (
              <div className="qd-summary-row">
                <span>
                  Less discount
                  {quotation.subtotal > 0
                    ? ` (${formatPlain((quotation.discountTotal / quotation.subtotal) * 100)}%)`
                    : ''}
                </span>
                <span>−{formatMoney(quotation.discountTotal, currency)}</span>
              </div>
            )}
            <div className="qd-summary-row">
              <span>
                Installation charges
                {storedInstallation ? '' : ` (${formatPlain(plySqft)} shutter sq.ft × ${INSTALLATION_RATE_PER_SQFT})`}
              </span>
              <span>{formatMoney(installationAmount, currency)}</span>
            </div>
            {otherCharges.map((charge) => (
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
              <span>{formatMoney(displayedGrandTotal, currency)}</span>
            </div>
          </div>

          <table className="qd-billing-terms">
            <tbody>
              <tr className="qd-billing-terms-title">
                <td colSpan={2}>Terms and Conditions :</td>
              </tr>
              {BILLING_TABLE_TERMS.map((term, index) => (
                <tr key={term}>
                  <td colSpan={2}>
                    {index + 1}. {term}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(printedNotes.length > 0 || quotation.notesCustomer) && (
            <section className="qd-notes">
              <h2>Notes</h2>
              {printedNotes.map((field) => (
                <p className="qd-muted" key={field.fieldKey}>
                  {field.value}
                </p>
              ))}
              {quotation.notesCustomer && <p className="qd-muted">{quotation.notesCustomer}</p>}
            </section>
          )}
        </div>

        <footer className="qd-footer">
          <div className="qd-signature">
            {signatureDataUrl && <img src={signatureDataUrl} alt="" />}
            <div className="qd-sign-line">
              {company?.authorizedSignatory || 'Authorized signatory'}
            </div>
          </div>
        </footer>
      </article>

      {/* Terms & Conditions pages (from the company T&C document) */}
      <article className="qd-page qd-tnc">
        {watermark}
        {pageTop}

        <h1 className="qd-tnc-title">MODULAR KITCHEN – TERMS &amp; CONDITIONS</h1>

        <div className="qd-tnc-body">
          {MODULAR_KITCHEN_TERMS.map((clause, index) => (
            <section className="qd-tnc-clause" key={clause.title}>
              <h2>
                {index + 1}. {clause.title}
              </h2>
              {clause.paragraphs?.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
              {clause.bullets && (
                <ul>
                  {clause.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="qd-tnc-acceptance">
          <h2>CUSTOMER ACCEPTANCE</h2>
          <div className="qd-tnc-sign-grid">
            <div>
              <span>Customer Name</span>
              <strong>{customer?.name ?? quotation.customerName ?? ''}</strong>
            </div>
            <div>
              <span>Signature</span>
              <strong>&nbsp;</strong>
            </div>
            <div>
              <span>Date</span>
              <strong>&nbsp;</strong>
            </div>
            <div>
              <span>Order / Quotation No.</span>
              <strong>{quotation.quotationNumber}</strong>
            </div>
            <div>
              <span>Company Representative&apos;s Signature</span>
              <strong>&nbsp;</strong>
            </div>
            <div>
              <span>Company Seal / Stamp</span>
              <strong>&nbsp;</strong>
            </div>
          </div>
        </div>

        {(company?.bankDetails || company?.footer) && (
          <div className="qd-tnc-bank">
            <h2>BANK DETAILS</h2>
            {company?.bankDetails && <p>{company.bankDetails}</p>}
            {company?.footer && <p>{company.footer}</p>}
          </div>
        )}

        {documentQrs.length > 0 && (
          <div className="qd-tnc-qrs">
            <h2>SCAN &amp; CONNECT</h2>
            <div className="qd-tnc-qr-grid">
              {documentQrs.map((qr) => (
                <figure key={qr.label}>
                  <img src={qr.dataUrl} alt={qr.label} />
                  <figcaption>{qr.label}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
