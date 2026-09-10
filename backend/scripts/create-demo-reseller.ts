import { prisma } from '../src/config/prisma'
import { hashPassword, generateReferralCode, generateStoreSlug } from '../src/services/auth.service'

async function main() {
  const email = 'revendedora.demo@mbdamodas.com'
  const existing = await prisma.reseller.findUnique({ where: { email } })
  if (existing) {
    console.log(`Ya existe: ${email}`)
    process.exit(0)
  }

  const passwordHash = await hashPassword('demo1234')
  const referralCode = await generateReferralCode()
  const storeSlug = await generateStoreSlug('Tienda Demo')

  const reseller = await prisma.reseller.create({
    data: {
      firstName: 'Revendedora',
      lastName: 'Demo',
      email,
      passwordHash,
      dni: '30111222',
      whatsapp: '5493810000001',
      address: 'Av. Siempre Viva 123',
      city: 'Concepción',
      postalCode: '4111',
      storeName: 'Tienda Demo',
      storeSlug,
      referralCode,
      termsAcceptedAt: new Date(),
    },
  })

  console.log(`Creado: ${reseller.email} / demo1234 — tienda: /tienda/${reseller.storeSlug}`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
