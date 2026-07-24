import { eq } from 'drizzle-orm'
import type { CompanyProfile, CompanyProfileInput } from '../../shared/types'
import { getDatabase } from '../db'
import { companyProfile } from '../db/schema'
import { recordAudit } from './audit'

function now(): string {
  return new Date().toISOString()
}

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  const db = getDatabase()
  const row = db.select().from(companyProfile).where(eq(companyProfile.id, 1)).get()
  return row ?? null
}

export async function upsertCompanyProfile(data: CompanyProfileInput): Promise<CompanyProfile> {
  const db = getDatabase()
  const updatedAt = now()
  const existing = db.select().from(companyProfile).where(eq(companyProfile.id, 1)).get()

  if (existing) {
    db.update(companyProfile)
      .set({
        name: data.name,
        logoPath: data.logoPath ?? null,
        address: data.address ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        website: data.website ?? null,
        taxRegNumber: data.taxRegNumber ?? null,
        panNumber: data.panNumber ?? null,
        bankDetails: data.bankDetails ?? null,
        authorizedSignatory: data.authorizedSignatory ?? null,
        signaturePath: data.signaturePath ?? null,
        footer: data.footer ?? null,
        updatedAt
      })
      .where(eq(companyProfile.id, 1))
      .run()
  } else {
    db.insert(companyProfile)
      .values({
        id: 1,
        name: data.name,
        logoPath: data.logoPath ?? null,
        address: data.address ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        website: data.website ?? null,
        taxRegNumber: data.taxRegNumber ?? null,
        panNumber: data.panNumber ?? null,
        bankDetails: data.bankDetails ?? null,
        authorizedSignatory: data.authorizedSignatory ?? null,
        signaturePath: data.signaturePath ?? null,
        footer: data.footer ?? null,
        updatedAt
      })
      .run()
  }

  const row = db.select().from(companyProfile).where(eq(companyProfile.id, 1)).get()
  if (!row) {
    throw new Error('Failed to save company profile')
  }
  recordAudit({
    action: existing ? 'edit' : 'create',
    entityType: 'company',
    entityId: row.id
  })
  return row
}
