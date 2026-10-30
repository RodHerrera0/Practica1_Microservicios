// Servicio BIBLIOTECA — los juegos que el usuario YA compró.
// Microservicio independiente: guarda su propia lista.
//
// DOS MODOS (lo mismo, distinto dónde guarda):
//  - Con Supabase (en la nube): si hay SUPABASE_URL + SUPABASE_SERVICE_KEY,
//    guarda en una tabla de Postgres → los datos SOBREVIVEN a reinicios y redeploys.
//  - Sin Supabase (local, como en la Clase 22): guarda en memoria → se pierde al apagar.
// Esto es clave en la nube: el disco de un servicio free se borra en cada redeploy,
// por eso los datos van a una base gestionada (Supabase), no en memoria.
import express from 'express'
import { createClient } from '@supabase/supabase-js'

const app = express()
app.use(express.json()) // para poder leer el body JSON en el POST
const PORT = process.env.PORT || 4002

// ¿Tenemos credenciales de Supabase? (las pone el alumno como variables de entorno)
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
const usarSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY)
const supabase = usarSupabase ? createClient(SUPABASE_URL, SUPABASE_KEY) : null

// Respaldo en memoria (solo si NO hay Supabase).
const MIOS = []

console.log(usarSupabase
  ? '[biblioteca] usando Supabase (datos persistentes)'
  : '[biblioteca] usando memoria (sin Supabase; los datos se pierden al apagar)')

// Lista de juegos comprados.
app.get('/mios', async (req, res) => {
  if (usarSupabase) {
    const { data, error } = await supabase
      .from('biblioteca')
      .select('id, titulo, genero, precio')
      .order('id')
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }
  res.json(MIOS)
})

// Guardar un juego comprado.
app.post('/mios', async (req, res) => {
  const juego = req.body
  if (!juego || !juego.id) {
    return res.status(400).json({ error: 'Falta el juego' })
  }

  if (usarSupabase) {
    // upsert por id (clave primaria) → evita duplicados sin romper.
    const { error } = await supabase
      .from('biblioteca')
      .upsert(
        { id: juego.id, titulo: juego.titulo, genero: juego.genero, precio: juego.precio },
        { onConflict: 'id' }
      )
    if (error) return res.status(500).json({ error: error.message })
    const { data: todos } = await supabase
      .from('biblioteca')
      .select('id, titulo, genero, precio')
      .order('id')
    return res.status(201).json({ ok: true, biblioteca: todos })
  }

  // Modo memoria: evitamos duplicados.
  if (!MIOS.find(j => j.id === juego.id)) MIOS.push(juego)
  res.status(201).json({ ok: true, biblioteca: MIOS })
})

app.listen(PORT, () => console.log(`[biblioteca] escuchando en :${PORT}`))
