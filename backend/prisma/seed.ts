import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ── T&C completos (se aplican tanto en create como en update) ─────────────────
const TERMS_CONTENT = `# Términos y Condiciones del Programa de Revendedores
## MBDA Modas — Programa de Revendedores

Al registrarte en la plataforma MBDA Revendedores y activar tu cuenta, declarás haber leído, comprendido y aceptado en su totalidad los presentes Términos y Condiciones. Si no estás de acuerdo con alguno de estos puntos, no debés registrarte ni utilizar la plataforma.

---

## 1. Definiciones

- **MBDA Modas / MBDA**: empresa titular de la plataforma y proveedora de los productos.
- **Revendedor**: persona física o jurídica registrada en la plataforma que comercializa productos de MBDA a sus propios clientes.
- **Comprador**: cliente final que adquiere productos a través del catálogo del Revendedor.
- **Pedido**: solicitud de compra generada por un Comprador en el catálogo digital del Revendedor.
- **Comisión**: diferencia entre el precio de venta fijado por el Revendedor y el precio base de MBDA.
- **Plataforma**: sistema digital de MBDA Revendedores, incluyendo panel web, catálogo público y API.

---

## 2. Registro y Elegibilidad

- Podés registrarte únicamente si sos mayor de 18 años y tenés capacidad legal para celebrar contratos.
- Cada persona puede tener **una sola cuenta activa**. Crear múltiples cuentas para obtener ventajas o evadir suspensiones es causa inmediata de baja permanente.
- Sos responsable de mantener tus credenciales de acceso (email y contraseña) en estricta confidencialidad. Cualquier actividad realizada desde tu cuenta es tu responsabilidad exclusiva, independientemente de quién haya operado.
- Si detectás acceso no autorizado a tu cuenta, debés notificarlo de inmediato a MBDA.
- MBDA se reserva el derecho de rechazar o revocar registros sin expresar causa, especialmente ante datos falsos o incompletos.

---

## 3. Catálogo y Precios

- Podés agregar a tu catálogo cualquier producto activo de MBDA y fijar el precio de venta que desees, **siempre que sea igual o mayor al precio base establecido por MBDA**. La plataforma rechaza automáticamente precios inferiores al base.
- Sos el único responsable de los precios que publicás a tus compradores. MBDA no interviene en la relación comercial entre vos y tus clientes.
- MBDA puede modificar precios base, discontinuar productos o cambiar condiciones con un preaviso razonable. Los pedidos ya confirmados no se ven afectados por cambios de precio posteriores.
- No podés publicar los productos de MBDA en plataformas de terceros (Mercado Libre, Instagram Shopping, etc.) sin autorización escrita previa de MBDA.

---

## 4. Proceso de Pedidos y Stock

- Cuando un Comprador realiza un pedido, el stock queda **reservado por 24 horas** mientras se espera la confirmación del pago.
- Vencidas las 24 horas sin confirmación de pago, el pedido se cancela automáticamente y el stock se libera. **MBDA no tiene obligación de mantener el stock reservado más allá de ese plazo.**
- La disponibilidad de stock no está garantizada: el stock puede agotarse entre el momento en que el Comprador genera el pedido y el momento en que MBDA lo confirma. En ese caso, MBDA notificará al Revendedor para coordinar una solución.
- MBDA no garantiza disponibilidad de tallas, colores ni productos específicos en ningún momento.

---

## 5. Pagos — Condiciones Estrictas

### 5.1 Medio de pago aceptado
- El único medio de pago aceptado es la **transferencia bancaria** al CBU o alias publicado en el catálogo. No se aceptan pagos en efectivo, Mercado Pago, tarjeta, código QR ni ningún otro medio salvo acuerdo escrito previo con MBDA.

### 5.2 Confirmación previa al despacho
- **MBDA solo despacha pedidos una vez que el importe correspondiente haya impactado efectivamente en la cuenta bancaria de MBDA**, sin excepción. El envío de un comprobante de transferencia (captura de pantalla, PDF, etc.) **no constituye confirmación de pago**; MBDA verifica el acreditamiento directamente en su cuenta.
- Si la transferencia demora en acreditarse (por ejemplo, fines de semana, feriados o problemas bancarios), el pedido se mantendrá pendiente hasta la acreditación efectiva o hasta el vencimiento de las 24 horas de reserva, lo que ocurra primero.
- MBDA no se hace responsable de transferencias que no lleguen a la cuenta por errores del Comprador al ingresar el CBU/alias, por fallas del banco emisor, por reversiones automáticas del sistema bancario, ni por cualquier otra causa ajena a MBDA.

### 5.3 Transferencias revertidas o no acreditadas
- Si una transferencia es revertida, rechazada, anulada o no acreditada por cualquier motivo después de que MBDA haya despachado el pedido basándose en una confirmación bancaria posterior invalidada, **el Revendedor asume la responsabilidad económica total** por el valor del pedido. MBDA podrá retener comisiones futuras o reclamar el importe por las vías legales que correspondan.
- El Revendedor acepta que es quien conoce a su Comprador y responde por la veracidad del pago ante MBDA.

### 5.4 Comprobantes de pago
- Los comprobantes de transferencia enviados al WhatsApp de MBDA son utilizados como referencia para localizar la acreditación, pero **nunca son suficientes por sí solos para liberar el pedido**. La decisión final sobre la confirmación del pago corresponde exclusivamente a MBDA.

---

## 6. Fraude, Falsificación y Conductas Deshonestas

- Está **terminantemente prohibido** enviar, facilitar o utilizar comprobantes de pago alterados, falsificados, duplicados o pertenecientes a transferencias de terceros no relacionados con el pedido en cuestión.
- Está prohibido intentar engañar a MBDA mediante cualquier medio, incluyendo pero no limitado a: capturas de pantalla modificadas, chats manipulados, recibos de pago inventados, presión indebida o información falsa.
- Ante cualquier indicio de fraude o falsificación, MBDA procederá a:
  - Suspender la cuenta del Revendedor de forma inmediata y sin previo aviso.
  - Cancelar todos los pedidos pendientes sin reembolso de comisiones.
  - Denunciar el hecho ante las autoridades competentes (art. 172 y ss. del Código Penal Argentino — estafa; art. 292 y ss. — falsificación de documentos).
  - Reclamar los daños y perjuicios ocasionados por la vía civil y/o penal.
- Esta cláusula aplica tanto al Revendedor directamente como a cualquier Comprador que actúe con su conocimiento o complicidad.

---

## 7. Devoluciones y Cambios

- MBDA acepta devoluciones o cambios **únicamente** en los siguientes casos:
  - El producto recibido tiene un defecto de fabricación comprobable.
  - Se envió un producto distinto al pedido (talle, color o artículo incorrecto).
  - El producto llegó dañado por el transporte (con constancia del correo).
- Para iniciar un reclamo por alguno de los casos anteriores, el Revendedor (o su Comprador a través del Revendedor) debe:
  - Notificar a MBDA dentro de las **48 horas posteriores a la recepción** del producto.
  - Proveer fotos claras del producto, del packaging y del remito de entrega.
- **No se aceptan devoluciones ni cambios** por los siguientes motivos:
  - Arrepentimiento del Comprador.
  - Error del Comprador al elegir talle o color.
  - Demora en el envío atribuible al correo o condiciones externas.
  - Expectativas subjetivas sobre el producto (diferencias de color por pantalla, textura, etc.).
- Los gastos de envío de devolución corren a cargo del Revendedor o su Comprador, salvo que el error sea atribuible exclusivamente a MBDA.

---

## 8. Envíos y Entregas

- MBDA despacha los pedidos dentro de los **3 días hábiles** posteriores a la confirmación del pago en la cuenta bancaria.
- Una vez despachado el pedido, MBDA informará el número de seguimiento al Revendedor. El seguimiento y la coordinación con el Comprador son responsabilidad del Revendedor.
- **MBDA no se hace responsable de demoras, pérdidas, daños o robos ocurridos durante el transporte**, una vez entregado el paquete al correo o empresa de mensajería. El Revendedor debe gestionar cualquier reclamo directamente con la empresa de transporte.
- El plazo de entrega informado es estimativo y puede variar por causas de fuerza mayor, conflictos gremiales, problemas climáticos u otras situaciones ajenas a MBDA.
- Si el Comprador no retira el paquete y éste es devuelto a MBDA, el costo de reenvío corre a cargo del Comprador. Si el paquete no puede ser reenviado, no se realizará reembolso alguno.

---

## 9. Comisiones

- Las comisiones se generan automáticamente al momento en que MBDA confirma el pago del pedido.
- Las comisiones se transfieren al CBU/alias registrado en el perfil del Revendedor en la plataforma. **MBDA no se hace responsable de transferencias realizadas a datos bancarios incorrectos o desactualizados**. Es responsabilidad del Revendedor mantener sus datos de cobro vigentes.
- MBDA puede retener comisiones de forma preventiva si existe una disputa, reclamo abierto, sospecha de fraude o deuda del Revendedor con MBDA.
- Las comisiones son en pesos argentinos (ARS). Cualquier variación cambiaria o inflacionaria no da derecho a ajustes retroactivos.

---

## 10. Responsabilidades del Revendedor

- El Revendedor es el único interlocutor válido de sus Compradores. MBDA no tiene relación directa con los Compradores y no responde a sus consultas, reclamos ni demandas.
- El Revendedor debe informar correctamente a sus Compradores sobre los productos, precios, plazos y condiciones de envío, sin inducir a error ni engaño.
- El Revendedor se compromete a no dañar la reputación de MBDA Modas mediante comentarios falsos, difamatorios o tendenciosos en redes sociales, foros u otros medios.
- Cualquier reclamo de un Comprador que derive en un perjuicio para MBDA (incluyendo reversiones de pago, demandas, publicidad negativa) será reclamado al Revendedor.

---

## 11. Propiedad Intelectual

- Las fotografías, descripciones, logos y demás contenidos de MBDA son propiedad exclusiva de MBDA Modas.
- Se otorga al Revendedor una **licencia no exclusiva, no transferible y revocable** para usar las imágenes y descripciones de los productos únicamente en su catálogo digital dentro de la plataforma y en sus propias redes sociales, con el único fin de promover la venta de dichos productos.
- Está **prohibido** modificar, recortar, alterar o usar las imágenes de MBDA de forma que dañen la imagen de la marca o induzcan a confusión sobre el origen de los productos.
- Al desvincularse del programa, el Revendedor debe dejar de usar todo el material gráfico de MBDA.

---

## 12. Conductas Prohibidas

Además de lo indicado en otras secciones, está expresamente prohibido:

- Intentar acceder a áreas restringidas de la plataforma o a cuentas de otros usuarios.
- Utilizar herramientas automatizadas para interactuar con la plataforma sin autorización.
- Revender o transferir tu acceso a la plataforma o tu código de revendedor a terceros.
- Compartir tu código de referido de forma masiva o indiscriminada para simular actividad y obtener ventajas.
- Publicar precios engañosos, hacer publicidad falsa o inducir a error al Comprador sobre los productos.
- Actuar como intermediario entre Compradores y MBDA, pretendiendo ser empleado o representante oficial de MBDA Modas.
- Cualquier conducta que viole la legislación argentina vigente.

---

## 13. Suspensión y Baja de Cuenta

MBDA puede suspender temporal o definitivamente tu cuenta, con o sin previo aviso, ante:

- Incumplimiento de cualquier punto de estos Términos y Condiciones.
- Actividad fraudulenta, falsificación de documentos o intento de estafa.
- Pedidos no pagados o deuda pendiente con MBDA.
- Conducta inapropiada hacia el personal de MBDA o hacia otros revendedores.
- Inactividad prolongada (sin pedidos confirmados por más de 6 meses).
- Decisión comercial unilateral de MBDA, sin necesidad de expresar causa.

La suspensión o baja no genera derecho a indemnización, reembolso ni compensación de ningún tipo, salvo comisiones ya devengadas y confirmadas.

---

## 14. Limitación de Responsabilidad

- MBDA no garantiza la disponibilidad ininterrumpida de la plataforma ni la ausencia de errores técnicos.
- La responsabilidad total de MBDA ante cualquier reclamo del Revendedor se limita al valor del pedido específico en disputa, sin incluir lucro cesante, daño emergente, daño moral ni ningún otro concepto indirecto.
- MBDA no se hace responsable por decisiones comerciales del Revendedor ni por pérdidas que éste sufra como consecuencia de las mismas.

---

## 15. Indemnización

El Revendedor se compromete a indemnizar, defender y eximir de responsabilidad a MBDA Modas, sus directivos, empleados y colaboradores, frente a cualquier reclamo, demanda, pérdida, daño, multa o gasto (incluyendo honorarios legales razonables) que surja del incumplimiento de estos Términos por parte del Revendedor, de las acciones u omisiones de sus Compradores, o del uso indebido de la plataforma.

---

## 16. Modificaciones de los Términos

- MBDA puede modificar estos Términos y Condiciones en cualquier momento.
- Las modificaciones se publicarán en la plataforma con indicación de la fecha de actualización.
- Si continuás usando la plataforma después de la publicación de cambios, se entiende que aceptaste los nuevos términos.
- Si no estás de acuerdo con los cambios, podés solicitar la baja de tu cuenta.

---

## 17. Política de Privacidad

- Los datos personales que proporcionás al registrarte (nombre, email, WhatsApp, CBU) son utilizados exclusivamente para gestionar tu cuenta, procesar pedidos y realizar transferencias de comisiones.
- MBDA no vende ni comparte tus datos personales con terceros, salvo obligación legal.
- Tenés derecho de acceso, rectificación y supresión de tus datos conforme a la Ley 25.326 de Protección de Datos Personales de Argentina.

---

## 18. Contacto y Reclamos

Para consultas, reclamos o notificaciones formales relacionadas con estos Términos, debés comunicarte con MBDA Modas a través del WhatsApp oficial o el correo electrónico registrado en la plataforma. Los reclamos deben realizarse dentro de los **30 días corridos** de ocurrido el hecho que los origina; vencido ese plazo, se consideran renunciados.

---

## 19. Ley Aplicable y Jurisdicción

Estos Términos y Condiciones se rigen por las leyes de la **República Argentina**. Para cualquier controversia que no pueda resolverse de forma amigable, las partes se someten a la jurisdicción de los Tribunales Ordinarios de la ciudad de **San Miguel de Tucumán, Provincia de Tucumán**, renunciando a cualquier otro fuero o jurisdicción que pudiera corresponder.

---

*Al hacer clic en "Crear cuenta gratis" confirmás que leíste y aceptaste íntegramente estos Términos y Condiciones.*`

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
  // update incluye termsContent para actualizar instalaciones existentes con T&C viejos
  await prisma.config.upsert({
    where: { id: 'singleton' },
    update: { termsContent: TERMS_CONTENT, termsUpdatedAt: new Date() },
    create: {
      id: 'singleton',
      cbu: '',
      alias: '',
      whatsapp: '',
      dispatchDays: 3,
      stockReserveHours: 24,
      termsContent: TERMS_CONTENT,
      termsUpdatedAt: new Date(),
    },
  })
  console.log('✅ Config:     singleton (T&C actualizados)')

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
