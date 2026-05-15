import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...\n')

  // ── Admin ─────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@mbdamodas.com' },
    update: {},
    create: {
      email: 'admin@mbdamodas.com',
      passwordHash,
      name: 'Admin MBDA Revendedores',
    },
  })
  console.log(`✅ Admin:      ${admin.email}  (contraseña: admin123)`)

  // ── Config ────────────────────────────────────────────────
  await prisma.config.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      cbu: '',
      alias: '',
      whatsapp: '',
      dispatchDays: 3,
      stockReserveHours: 24,
      termsContent: `# Términos y Condiciones del Programa de Revendedores MBDA Modas

**Última actualización:** ${new Date().toLocaleDateString('es-AR')}

Al registrarte como revendedor en la plataforma MBDA Revendedores, aceptás los siguientes términos y condiciones:

## 1. Sobre el programa
El programa de revendedores de MBDA Modas te permite armar tu propio catálogo con nuestros productos y venderlos a tus clientes al precio que vos elijas.

## 2. Responsabilidades
- Debés informar correctamente los precios a tus clientes.
- El envío y el seguimiento de los pedidos es coordinado entre vos y MBDA Modas.
- Las comisiones se acreditan una vez confirmado el pago del pedido.

## 3. Pagos y comisiones
- Las comisiones se calculan según el precio de venta que establezcas.
- Los pagos de comisiones se realizan según la modalidad acordada con el administrador.

## 4. Uso de la plataforma
- No podés compartir tus credenciales de acceso.
- MBDA Modas se reserva el derecho de desactivar cuentas que incumplan estos términos.
`,
      termsUpdatedAt: new Date(),
    },
  })
  console.log('✅ Config:     singleton (valores por defecto)')

  // ── Categorías ────────────────────────────────────────────
  const categorias = [
    { name: 'Remeras', order: 0 },
    { name: 'Pantalones', order: 1 },
    { name: 'Vestidos', order: 2 },
    { name: 'Accesorios', order: 3 },
    { name: 'Calzado', order: 4 },
  ]
  for (const cat of categorias) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }
  console.log(`✅ Categorías: ${categorias.map(c => c.name).join(', ')}`)

  console.log('\n🎉 Seed completado!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
