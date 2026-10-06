/**
 * Static document content from the "QUALITY PRODUCTS" company profile document.
 * Pages 1–2 are printed before the quotation; the Terms & Conditions pages after it.
 */

export const ABOUT_TAGLINE = 'QUALITY PRODUCTS  |  CUSTOM DESIGN  |  FAIR PRICING  |  TIMELY DELIVERY'

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

export const ABOUT_PAGE_TWO = {
  heading: 'WHY CHOOSE SILEX KITCHEN?',
  intro: 'We are committed to delivering:',
  promises:
    'Premium Materials | Smart Designs | Quality Workmanship | Transparent Pricing | Timely Delivery | Professional Installation | After-Sales Support',
  paragraphs: [
    'Every project is executed with careful attention to design, material quality, finishing, functionality, and customer satisfaction.',
    'At Silex Kitchen, our goal is not just to create furniture, but to create spaces that are comfortable, functional, elegant, and made for you.',
    'We look forward to the opportunity to work with you and transform your vision into a beautifully designed space.'
  ],
  tagline: 'DESIGN YOUR DREAM. LIVE YOUR STYLE.'
}

export type TermsClause = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
  trailingParagraphs?: string[]
}

export const MODULAR_KITCHEN_TERMS: TermsClause[] = [
  {
    title: 'Scope of Work',
    paragraphs: [
      'The Company shall design, manufacture, supply, and install the modular kitchen as per the approved quotation, design, and specifications agreed upon with the Customer.'
    ]
  },
  {
    title: 'Quotation & Pricing',
    paragraphs: [
      'The quotation shall remain valid for 15 days from the date of issue.',
      'After confirmation of the order, any changes in design, measurements, materials, accessories, or other specifications may be subject to additional charges.',
      'Applicable GST and other government taxes shall be charged additionally to the Customer.'
    ]
  },
  {
    title: 'Payment Terms',
    paragraphs: [
      '50% Advance Payment – At the time of order confirmation.',
      '40% Payment – Upon completion of production / before dispatch.',
      '10% Final Payment – Immediately after completion of installation.'
    ]
  },
  {
    title: 'Final Design Approval',
    paragraphs: [
      'Production shall commence only after the Customer provides approval of the final design in written or digital form. Any changes requested after approval may result in additional costs and delays in delivery.'
    ]
  },
  {
    title: 'Site Preparation',
    paragraphs: [
      'Before installation, the Customer shall ensure that all necessary civil work, electrical work, plumbing, flooring, painting, and other related work is completed and the site is ready for installation.',
      'The Company shall not be responsible for any delay in installation caused due to an unprepared site or any other reason attributable to the Customer.'
    ]
  },
  {
    title: 'Delivery & Installation',
    paragraphs: [
      'The delivery date provided by the Company shall be an estimated date.',
      'Delivery timelines may vary due to material availability, transportation, weather conditions, government restrictions, or other unforeseen circumstances.',
      'The Customer shall provide the necessary electricity, water, working space, and access to the site during delivery and installation.'
    ]
  },
  {
    title: 'Customer Responsibilities',
    paragraphs: ['The Customer shall:'],
    bullets: [
      'Provide accurate site measurements and all necessary information.',
      'Ensure the availability of electricity and water during installation.',
      'Remove old furniture, appliances, or any other obstructions, wherever necessary, before installation.',
      "Provide safe and proper access to the site for the Company's employees and installation team."
    ]
  },
  {
    title: 'Materials & Finish',
    paragraphs: [
      'Natural wood, veneer, stone, or other natural materials may have natural variations in colour, texture, grain, and patterns. Therefore, the actual product colour or finish may vary slightly from the sample shown or approved.'
    ]
  },
  {
    title: 'Warranty',
    paragraphs: [
      'The warranty shall be limited only to manufacturing defects in products supplied by the Company.',
      'The Customer shall be provided with a warranty card/warranty certificate only after receipt of 100% payment of the order value. The warranty card/certificate shall not be issued until the full payment is received.'
    ]
  },
  {
    title: 'Warranty Conditions',
    paragraphs: [
      'The warranty period shall be as specified in the respective invoice/warranty card.',
      'During the warranty period, the Customer shall comply with the usage and maintenance instructions specified by the Company.',
      "If the Customer independently replaces or adds any material, fitting, hardware, or other component without prior permission from the Company, the Company's warranty shall not apply to such replaced or added materials.",
      "The Company's warranty shall not apply to materials supplied by the Customer or materials subsequently purchased and installed by the Customer.",
      'Warranty shall not cover damage caused due to:'
    ],
    bullets: [
      'Misuse or negligence',
      'Water leakage, moisture, termites, or insects',
      'Fire, natural disasters, or other external causes',
      'Normal wear and tear',
      'Repairs, alterations, or modifications carried out without prior permission from the Company',
      'Any unauthorized work carried out by the Customer or any third party'
    ]
  },
  {
    title: 'Order Cancellation',
    paragraphs: [
      'If the Customer cancels the order after production has commenced, the advance amount paid shall be non-refundable.',
      'If the order is cancelled before production commences, administrative and/or other charges may be deducted based on the actual expenses incurred by the Company.',
      "Custom-made products manufactured according to the Customer's measurements or specific requirements cannot be returned or exchanged."
    ]
  },
  {
    title: 'Damages & Complaints',
    paragraphs: [
      'If any visible damage, broken parts, or shortage of materials is noticed after completion of installation, the Customer must inform the Company in writing within 48 hours.',
      'After inspection, if the Company determines that the issue is an actual product defect, the Company shall repair the defect or replace the relevant part, as required, within a reasonable period.'
    ]
  },
  {
    title: 'Ownership Rights',
    paragraphs: [
      'Ownership of the products supplied shall remain with the Company until the Company receives 100% payment of the order amount from the Customer.'
    ]
  },
  {
    title: 'Limitation of Liability',
    paragraphs: [
      "The Company's total liability shall be limited to the total value of the respective order. The Company shall not be liable for any indirect, incidental, or consequential damages."
    ]
  },
  {
    title: 'Force Majeure',
    paragraphs: [
      "The Company shall not be liable for any delay caused by natural disasters, floods, fire, pandemics, strikes, government restrictions, transportation disruptions, unavailability of materials, or any other circumstances beyond the Company's reasonable control."
    ]
  },
  {
    title: 'Governing Law & Jurisdiction',
    paragraphs: [
      "These Terms & Conditions shall be governed by the applicable laws of India. In case of any dispute, the competent courts having jurisdiction over the Company's registered office shall have jurisdiction over such dispute."
    ]
  },
  {
    title: 'Customer Acceptance',
    paragraphs: [
      'By confirming the order and making the advance payment, the Customer shall be deemed to have read, understood, and accepted all the above Terms & Conditions.'
    ]
  }
]
