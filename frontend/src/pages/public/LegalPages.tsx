import { LegalPage } from './LegalPage'
import { getPublicPrivacyPolicy, getPublicChangePolicy, getPublicWithdrawalRight } from '../../api/public'

// ── Contenido por defecto (editable desde Admin → Configuración → Legales) ────

const PRIVACY_DEFAULT = `# Política de Privacidad

Al registrarte o utilizar la plataforma MBDA Revendedores, aceptás las prácticas descriptas en esta Política de Privacidad. MBDA Modas es responsable del tratamiento de los datos personales recolectados a través de la plataforma.

---

## 1. Datos que recolectamos

- Datos de la revendedora: nombre, apellido, DNI, email, WhatsApp, CBU/alias, dirección, ciudad y código postal.
- Datos del comprador: nombre y WhatsApp, informados directamente a la revendedora al consultar o reservar un producto.
- Datos de uso de la plataforma (accesos, catálogo armado, pedidos, preferencias guardadas en tu propio navegador como favoritos o el carrito de compra).

## 2. Para qué usamos tus datos

- Gestionar tu cuenta y tu catálogo de revendedora.
- Procesar reservas, confirmar pagos y liquidar comisiones.
- Prevenir fraudes, verificar identidad y proteger la seguridad de la plataforma y de las cuentas de sus usuarios.
- Comunicarnos con vos por WhatsApp o email ante consultas o novedades del programa.
- Cumplir con obligaciones legales, contables e impositivas aplicables al negocio.

## 3. Con quién compartimos tus datos

MBDA no vende tus datos personales. Solo los compartimos con:

- Proveedores tecnológicos que dan soporte a la plataforma (por ejemplo, almacenamiento de imágenes en la nube), únicamente en la medida necesaria para prestar el servicio y bajo obligaciones de confidencialidad.
- Autoridades competentes, cuando exista obligación legal, un requerimiento judicial o de un organismo con facultades para exigirlo.
- Terceros involucrados en la logística de un pedido (por ejemplo, empresas de correo), limitado a los datos necesarios para la entrega.

## 4. Cuánto tiempo conservamos tus datos

Conservamos tus datos personales mientras tu cuenta esté activa y, luego de su baja, por el plazo necesario para cumplir obligaciones legales, contables e impositivas, o para resolver reclamos o disputas pendientes. Pasado ese plazo, los datos se eliminan o anonimizan.

## 5. Tus derechos

Conforme a la Ley 25.326 de Protección de Datos Personales de Argentina, tenés derecho a acceder, rectificar, actualizar y solicitar la supresión de tus datos personales, así como a revocar el consentimiento otorgado. Podés ejercer estos derechos escribiéndonos por WhatsApp o al email registrado en la plataforma. Si considerás que tu derecho a la protección de datos fue vulnerado, también podés hacer una reclamación ante la **Agencia de Acceso a la Información Pública (AAIP)**, autoridad de control de la Ley 25.326.

## 6. Menores de edad

La plataforma está destinada a personas mayores de 18 años. No recolectamos deliberadamente datos personales de menores de edad. Si tomamos conocimiento de que se registraron datos de un menor sin la autorización correspondiente, los eliminaremos.

## 7. Seguridad

Implementamos medidas técnicas y organizativas razonables para proteger tus datos (por ejemplo, contraseñas cifradas, control de acceso según el rol de cada usuario y límites ante intentos repetidos de inicio de sesión), pero ningún sistema es 100% infalible. Es tu responsabilidad mantener tu contraseña en confidencialidad y notificarnos ante cualquier uso no autorizado de tu cuenta. Ante un incidente de seguridad que comprometa datos personales, notificaremos a los usuarios afectados y, cuando corresponda, a la autoridad de control, conforme a la normativa vigente.`

const CHANGE_POLICY_DEFAULT = `# Política de Cambios

## 1. Cambios por defecto de fabricación o error de envío

Si el producto tiene un defecto de fabricación o se envió un artículo distinto al pedido (talle, color o modelo incorrecto), MBDA acepta el cambio dentro de las **48 horas** posteriores a la recepción, con fotos del producto y del packaging.

## 2. Cambios por talle o color (arrepentimiento del comprador)

Fuera de los casos anteriores, el cambio por talle o color queda a criterio de cada revendedora, ya que es quien coordina la entrega y conoce a su cliente. Consultá directamente con tu revendedora las condiciones particulares.

## 3. Estado del producto

Para aceptar un cambio, el producto debe estar sin uso, con etiquetas originales y en su empaque original.

## 4. Cómo pedir un cambio

Escribile a tu revendedora por WhatsApp dentro de los plazos indicados. Ella te va a guiar sobre cómo coordinar el cambio o, si corresponde, cómo se resuelve con MBDA.`

const WITHDRAWAL_RIGHT_DEFAULT = `# Derecho de Arrepentimiento

## 1. Marco legal

De acuerdo con el artículo 34 de la Ley de Defensa del Consumidor (24.240), en las compras realizadas a distancia el comprador tiene derecho a **revocar la aceptación durante el plazo de 10 (diez) días corridos** contados a partir de la entrega del producto, sin necesidad de expresar causa y sin que esto le genere responsabilidad alguna.

## 2. Cómo ejercer este derecho

Para ejercer el derecho de arrepentimiento, comunicate con la revendedora que te vendió el producto dentro del plazo de 10 días corridos desde que lo recibiste, indicando tu intención de revocar la compra.

## 3. Devolución del producto y del pago

- El producto debe devolverse en el mismo estado en que fue entregado, sin uso y con sus etiquetas originales.
- El costo del envío de devolución corre por cuenta del comprador, salvo que el producto presente un defecto de fabricación.
- Una vez recibido el producto en condiciones, se coordina el reintegro del pago según el medio utilizado.

## 4. Excepciones

Este derecho no aplica a productos confeccionados a medida o personalizados especialmente para el comprador, cuando esa fuera la naturaleza del pedido.`

export function PrivacyPolicyPage() {
  return <LegalPage title="Política de Privacidad" fetchContent={getPublicPrivacyPolicy} defaultContent={PRIVACY_DEFAULT} />
}

export function ChangePolicyPage() {
  return <LegalPage title="Política de Cambios" fetchContent={getPublicChangePolicy} defaultContent={CHANGE_POLICY_DEFAULT} />
}

export function WithdrawalRightPage() {
  return <LegalPage title="Derecho de Arrepentimiento" fetchContent={getPublicWithdrawalRight} defaultContent={WITHDRAWAL_RIGHT_DEFAULT} />
}
