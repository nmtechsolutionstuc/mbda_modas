import app from './app'
import { env } from './config/env'

app.listen(env.port, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${env.port}`)
  console.log(`   Entorno: ${env.nodeEnv}`)
  console.log(`   Health:  http://localhost:${env.port}/health`)
  console.log(`   Red:     Accesible desde otros dispositivos en la misma red`)
})
