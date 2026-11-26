/**
 * Static document content from the "QUALITY PRODUCTS" company profile document.
 * The About page is printed before the quotation; the Terms & Conditions page after it.
 */

/** Short billing-table terms shown below Total Amount (from quote sheet). */
export const BILLING_TABLE_TERMS: string[] = [
  'GST 18% applicable on the above amount.',
  'Quotation will be valid for 30 days.',
  'Payment Terms : 50% Advance,40% Before Dispatch , 10% After Fitting.',
  'In case of cancellation of order, deposited amount will not refund.',
  'Design and Colour Combination once finalized cannot be changed.',
  'Electrical apliances is not included.'
]

export const ABOUT_TAGLINE = 'QUALITY PRODUCTS  |  CUSTOM DESIGN  |  FAIR PRICING  |  TIMELY DELIVERY'

/** Slogan printed centred above the footer rule on the first page. */
export const ABOUT_PAGE_ONE_SLOGAN = 'DESIGN YOUR DREAM. LIVE YOUR SPACE'

export const ABOUT_PAGE_ONE: Array<{ heading?: string; paragraphs: string[]; bullets?: string[] }> = [
  {
    paragraphs: [
      'Silex Kitchen is a trusted name in modular kitchen and interior solutions, dedicated to creating functional, elegant, and long-lasting spaces designed around your lifestyle and requirements.',
      'We specialize in modular kitchens, wardrobes, TV units, crockery units, storage solutions, and customized interior furniture, combining modern aesthetics with smart functionality and practical design.'
    ]
  },
  {
    heading: 'OUR DESIGN & MATERIAL PROMISE',
    paragraphs: [
      'We believe that every space deserves a personalized design. Our experienced design team understands your requirements, lifestyle, available space, and budget to create solutions that are both beautiful and functional.',
      'We use premium-quality boards, laminates, finishes, and trusted hardware from reputed brands to ensure durability, smooth operation, and an elegant finish.',
      'Our modular kitchen solutions are planned with attention to ergonomics, storage optimization, functionality, and aesthetics, ensuring that every inch of your kitchen is utilized effectively.'
    ]
  },
  {
    heading: 'COMPLETE INTERIOR SOLUTIONS',
    paragraphs: [
      'From concept and 3D design to manufacturing, delivery, and installation, Silex Kitchen provides an end-to-end solution for your project.',
      'Our services include:'
    ],
    bullets: [
      'Modular Kitchens',
      'Wardrobes & Dressing Units',
      'TV Units & Entertainment Units',
      'Crockery & Display Units',
      'Storage & Utility Solutions',
      'Customized Furniture',
      'Complete Interior Solutions'
    ]
  }
]

export type TermsClause = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
  trailingParagraphs?: string[]
}

/** Terms & Conditions from "Quotation terms & conditions new.docx" (10 clauses). */
export const MODULAR_KITCHEN_TERMS: TermsClause[] = [
  {
    title: 'Scope of Work',
    paragraphs: [
      'The Company shall design, manufacture, supply and install the modular kitchen as per the approved quotation and design specifications.'
    ]
  },
  {
    title: 'Quotation & Pricing',
    paragraphs: [
      'Quotation is valid for 15 days from the date of issue. Any changes after order confirmation in design, measurements, materials, accessories or specifications shall attract additional charges. GST and applicable taxes shall be charged extra.'
    ]
  },
  {
    title: 'Payment Terms',
    paragraphs: [
      '50% advance at order confirmation, 40% before dispatch upon completion of production, and 10% immediately after installation completion.'
    ]
  },
  {
    title: 'Design Approval',
    paragraphs: [
      'Production shall commence only after final design approval in written or digital form. Changes after approval may result in additional costs and delivery delays.'
    ]
  },
  {
    title: 'Site Readiness',
    paragraphs: [
      "Civil, electrical, plumbing, flooring, painting and other related work must be completed before installation. Delays due to site unpreparedness or customer-related reasons shall not be the Company's responsibility."
    ]
  },
  {
    title: 'Delivery & Installation',
    paragraphs: [
      'Delivery timelines are tentative and may vary due to material availability, transportation, weather, government restrictions or unforeseen circumstances. The Customer shall provide electricity, water, adequate workspace and site access.'
    ]
  },
  {
    title: 'Customer Responsibilities & Materials',
    paragraphs: [
      'The Customer shall provide accurate measurements, clear site access and remove old furniture or obstructions if required. Natural materials and finishes may have variations in colour, texture and pattern.'
    ]
  },
  {
    title: 'Warranty',
    paragraphs: [
      'Warranty shall cover manufacturing defects only, as specified in the invoice/warranty card. The warranty certificate shall be issued after 100% payment. Warranty excludes misuse, negligence, water/moisture, termites, fire, natural disasters, normal wear and tear, unauthorized repairs/modifications, third-party work and customer-supplied materials. Warranty may not apply to components replaced or added without Company approval.'
    ]
  },
  {
    title: 'Cancellation & Complaints',
    paragraphs: [
      'Cancellation after production commencement shall result in forfeiture of the advance. Before production, deductions may apply for actual expenses incurred. Custom-made products are non-returnable and non-exchangeable. Any visible damage, shortage or installation complaint must be reported in writing within 48 hours of installation. Verified defects shall be repaired or replaced within a reasonable period.'
    ]
  },
  {
    title: 'Ownership, Liability & Legal Terms',
    paragraphs: [
      "Ownership shall remain with the Company until full payment is received. Liability shall be limited to the order value, excluding indirect or consequential damages. The Company shall not be liable for delays due to circumstances beyond its control (Force Majeure). These terms shall be governed by Indian law, with disputes subject to the jurisdiction of competent courts at the Company's registered office."
    ]
  }
]
