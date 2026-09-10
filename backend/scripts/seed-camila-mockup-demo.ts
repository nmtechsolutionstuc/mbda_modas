import { prisma } from '../src/config/prisma'

/**
 * Puebla la cuenta demo "Local de Camila" con los mismos datos del mockup de
 * referencia (Fashion Premium) para poder comparar la tienda real 1 a 1 contra
 * la imagen: mismo nombre de producto, precio, colores, talles y fotos.
 * Las fotos son placeholders (picsum) — no fotos reales del catálogo.
 */
async function main() {
  const camila = await prisma.reseller.findFirst({ where: { storeName: { contains: 'Camila', mode: 'insensitive' } } })
  if (!camila) { console.log('No existe "Local de Camila"'); process.exit(1) }

  await prisma.reseller.update({
    where: { id: camila.id },
    data: { storePhoto: '/uploads/camila-hero.jpg' },
  })

  await prisma.config.update({
    where: { id: 'singleton' },
    data: { cbu: '0000003100012345678901', alias: 'localdecamila' },
  })

  const remeras = await prisma.category.findFirst({ where: { name: 'Remeras' } })
  const pantalones = await prisma.category.findFirst({ where: { name: 'Pantalones' } })
  const abrigos = await prisma.category.upsert({
    where: { name: 'Abrigos' },
    update: {},
    create: { name: 'Abrigos', order: 5 },
  })
  if (!remeras || !pantalones) { console.log('Faltan categorías base'); process.exit(1) }

  const PRODUCTS = [
    {
      name: 'Remera Morley Premium', basePrice: 19900, categoryId: remeras.id, photo: '/uploads/remera-morley.jpg',
      colors: ['Blanco', 'Negro', 'Beige'], sizes: ['S', 'M', 'L'],
    },
    {
      name: 'Blazer Antonia', basePrice: 59900, categoryId: abrigos.id, photo: '/uploads/blazer-antonia.jpg',
      colors: ['Negro', 'Blanco', 'Beige'], sizes: ['S', 'M', 'L'],
    },
    {
      name: 'Pantalón Palazzo', basePrice: 44900, categoryId: pantalones.id, photo: '/uploads/pantalon-palazzo.jpg',
      colors: ['Beige', 'Blanco', 'Negro'], sizes: ['36', '38', '40', '42'],
    },
    {
      name: 'Top Tejido', basePrice: 21900, categoryId: remeras.id, photo: '/uploads/top-tejido.jpg',
      colors: ['Negro', 'Beige'], sizes: ['S', 'M', 'L'],
    },
    {
      name: 'Campera Oversize', basePrice: 64900, categoryId: abrigos.id, photo: '/uploads/campera-oversize.jpg',
      colors: ['Beige', 'Negro'], sizes: ['S', 'M', 'L'],
    },
  ]

  for (const p of PRODUCTS) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } })
    const product = existing
      ? await prisma.product.update({
          where: { id: existing.id },
          data: { basePrice: p.basePrice, categoryId: p.categoryId, photos: [p.photo], isActive: true },
        })
      : await prisma.product.create({
          data: {
            name: p.name, basePrice: p.basePrice, categoryId: p.categoryId, photos: [p.photo],
            commissionPct: 20, kind: 'PHYSICAL', availableForResellers: true,
          },
        })

    // Variantes color x talle, stock generoso para que nada aparezca "sin stock"
    for (const color of p.colors) {
      for (const size of p.sizes) {
        await prisma.productVariant.upsert({
          where: { productId_size_color: { productId: product.id, size, color } },
          update: { stock: 15 },
          create: { productId: product.id, size, color, stock: 15 },
        })
      }
    }

    // Catálogo de Camila: vende al precio oficial (Caso A)
    await prisma.catalogItem.upsert({
      where: { resellerId_productId_saleMode: { resellerId: camila.id, productId: product.id, saleMode: 'ONLINE' } },
      update: { sellingPrice: p.basePrice, visible: true },
      create: { resellerId: camila.id, productId: product.id, sellingPrice: p.basePrice, saleMode: 'ONLINE', visible: true },
    })

    console.log(`✓ ${p.name}`)
  }

  console.log('Listo — "Local de Camila" ahora refleja el mockup de referencia.')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
