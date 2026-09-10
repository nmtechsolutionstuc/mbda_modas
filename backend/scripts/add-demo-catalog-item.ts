import { prisma } from '../src/config/prisma'

async function main() {
  const reseller = await prisma.reseller.findUnique({ where: { email: 'revendedora.demo@mbdamodas.com' } })
  if (!reseller) throw new Error('Demo reseller not found')

  const product = await prisma.product.findFirst({
    where: { isActive: true, availableForResellers: true, variants: { some: { stock: { gt: 0 } } } },
    include: { variants: true },
  })
  if (!product) {
    console.log('No hay productos activos con stock para agregar')
    process.exit(0)
  }

  const existing = await prisma.catalogItem.findUnique({
    where: { resellerId_productId_saleMode: { resellerId: reseller.id, productId: product.id, saleMode: 'ONLINE' } },
  })
  if (existing) {
    console.log(`Ya en catálogo: ${product.name}`)
    process.exit(0)
  }

  await prisma.catalogItem.create({
    data: { resellerId: reseller.id, productId: product.id, sellingPrice: product.basePrice, saleMode: 'ONLINE' },
  })
  console.log(`Agregado al catálogo: ${product.name} ($${product.basePrice})`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
