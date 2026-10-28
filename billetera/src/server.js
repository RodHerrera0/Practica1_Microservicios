// Servicio BILLETERA — el saldo del usuario para comprar juegos.
// Microservicio independiente: guarda su propio saldo (en memoria).
// No sabe qué juego se compra; solo recibe un monto y lo cobra (o lo recarga).
import express from 'express'

const app = express()
app.use(express.json()) // para poder leer el body JSON en los POST
const PORT = process.env.PORT || 4003

// "Base de datos" en memoria: el saldo con el que arranca el usuario.
let saldo = Number(process.env.SALDO_INICIAL) || 150

// Redondeamos a centavos para evitar errores de punto flotante (69.99 + ...).
const centavos = n => Math.round(n * 100) / 100

// Valida que el monto venga en el body y sea un número positivo.
function leerMonto(req, res) {
  const monto = Number(req.body?.monto)
  if (!Number.isFinite(monto) || monto <= 0) {
    res.status(400).json({ error: 'Monto inválido' })
    return null
  }
  return monto
}

app.get('/saldo', (req, res) => {
  res.json({ saldo })
})

app.post('/cobrar', (req, res) => {
  const monto = leerMonto(req, res)
  if (monto === null) return
  // 402 Payment Required: no alcanza el saldo, no se cobra nada.
  if (monto > saldo) {
    return res.status(402).json({ error: 'Saldo insuficiente', saldo })
  }
  saldo = centavos(saldo - monto)
  res.json({ ok: true, saldo })
})

app.post('/recargar', (req, res) => {
  const monto = leerMonto(req, res)
  if (monto === null) return
  saldo = centavos(saldo + monto)
  res.json({ ok: true, saldo })
})

app.listen(PORT, () => console.log(`[billetera] escuchando en :${PORT}`))
