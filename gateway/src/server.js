// Servicio GATEWAY — la ÚNICA puerta del sistema (:8080).
// Sirve la mini web y enruta a los servicios internos. Clave del lab:
// les habla por su NOMBRE DE SERVICIO (http://catalogo:4001), y la red interna
// de Docker lo resuelve sola. El gateway es el único que publica un puerto afuera.
import express from 'express'

const app = express()
app.use(express.json())
const PORT = process.env.PORT || 8080

// Las URLs vienen por variable de entorno (las define el compose.yml).
// Si corrieras fuera de Docker, el valor por defecto apunta a localhost.
const CATALOGO = process.env.CATALOGO_URL || 'http://localhost:4001'
const BIBLIOTECA = process.env.BIBLIOTECA_URL || 'http://localhost:4002'
const BILLETERA = process.env.BILLETERA_URL || 'http://localhost:4003'

// Sirve la mini web (public/index.html).
app.use(express.static('public'))

// Catálogo: el gateway le pide la lista al servicio CATÁLOGO.
app.get('/api/catalogo', async (req, res) => {
  const r = await fetch(`${CATALOGO}/juegos`)
  res.json(await r.json())
})

// Mi biblioteca: el gateway le pide la lista al servicio BIBLIOTECA.
app.get('/api/biblioteca', async (req, res) => {
  const r = await fetch(`${BIBLIOTECA}/mios`)
  res.json(await r.json())
})

// Saldo: el gateway le pide el saldo al servicio BILLETERA.
app.get('/api/saldo', async (req, res) => {
  const r = await fetch(`${BILLETERA}/saldo`)
  res.json(await r.json())
})

// Recargar: el gateway le pasa el monto al servicio BILLETERA.
app.post('/api/recargar', async (req, res) => {
  const r = await fetch(`${BILLETERA}/recargar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monto: req.body?.monto }),
  })
  res.status(r.status).json(await r.json())
})

// COMPRAR: acá se ven TRES microservicios colaborando.
// 1) el gateway le pide el juego al CATÁLOGO (para saber el precio)
// 2) le cobra el precio a la BILLETERA (si no alcanza, se corta acá)
// 3) y lo manda al servicio BIBLIOTECA para guardarlo.
app.post('/api/comprar/:id', async (req, res) => {
  const rc = await fetch(`${CATALOGO}/juegos/${req.params.id}`)
  if (!rc.ok) return res.status(404).json({ error: 'Juego no encontrado' })
  const juego = await rc.json()

  // Si ya lo tiene, no se lo cobramos dos veces.
  const mios = await (await fetch(`${BIBLIOTECA}/mios`)).json()
  if (mios.find(j => j.id === juego.id)) {
    return res.status(409).json({ error: 'Ya tenés este juego' })
  }

  const rw = await fetch(`${BILLETERA}/cobrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monto: juego.precio }),
  })
  if (!rw.ok) return res.status(rw.status).json(await rw.json())

  const rb = await fetch(`${BIBLIOTECA}/mios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(juego),
  })
  res.status(201).json(await rb.json())
})

app.listen(PORT, () => console.log(`[gateway] PlayStation Store en http://localhost:${PORT}`))
