import type { Player, Round } from './types'

/** Clave estable para un par de jugadores. */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

/**
 * Reparte n jugadores en mesas de 4 y 3, priorizando mesas de 4.
 * Devuelve los tamaños de mesa y cuántos jugadores quedan sin mesa (byes).
 * Cualquier n >= 3 se resuelve con 3s y 4s salvo n = 5, que exige 1 bye.
 */
export function computeTableSizes(n: number): { sizes: number[]; byes: number } {
  const composition = (count: number): number[] | null => {
    // t = número de mesas de 3. Empezamos en 0 para maximizar mesas de 4.
    for (let threes = 0; threes <= Math.floor(count / 3); threes++) {
      const rest = count - threes * 3
      if (rest >= 0 && rest % 4 === 0) {
        const fours = rest / 4
        return [...Array(fours).fill(4), ...Array(threes).fill(3)]
      }
    }
    return null
  }

  let byes = 0
  let current = n
  while (current >= 3) {
    const sizes = composition(current)
    if (sizes) return { sizes, byes }
    current -= 1
    byes += 1
  }
  return { sizes: [], byes: n }
}

/** Cuántas veces ha jugado junto cada par en rondas anteriores. */
function buildMeetings(rounds: Round[]): Map<string, number> {
  const meetings = new Map<string, number>()
  for (const round of rounds) {
    for (const table of round.tables) {
      for (let i = 0; i < table.seats.length; i++) {
        for (let j = i + 1; j < table.seats.length; j++) {
          const key = pairKey(table.seats[i], table.seats[j])
          meetings.set(key, (meetings.get(key) ?? 0) + 1)
        }
      }
    }
  }
  return meetings
}

/** Cuántos byes ha tenido cada jugador. */
function buildByeCounts(rounds: Round[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const round of rounds) {
    for (const id of round.byes) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export type GeneratedRound = {
  tables: string[][]
  byes: string[]
}

/**
 * Genera las mesas de una ronda.
 *
 * Estrategia:
 *  1. Ordena a los jugadores activos por puntos (los que van ganando arriba).
 *  2. Los junta en bloques por puntuación → los líderes se enfrentan entre sí.
 *  3. Al rellenar cada mesa evita, dentro de una ventana de puntuación cercana,
 *     a los rivales con los que ya se ha coincidido para no repetir emparejamientos.
 *  4. Si el número no cierra en mesas de 3/4, deja byes repartidos de forma justa.
 */
export function generateRoundTables(
  activePlayers: Player[],
  pointsMap: Map<string, number>,
  previousRounds: Round[],
  format: 'auto' | 'three-3' = 'auto'
): GeneratedRound {
  const meetings = buildMeetings(previousRounds)
  const byeCounts = buildByeCounts(previousRounds)

  // Orden por puntos desc; empates barajados para dar variedad al regenerar.
  const byPoints = (a: Player, b: Player) =>
    (pointsMap.get(b.id) ?? 0) - (pointsMap.get(a.id) ?? 0)
  const groups = new Map<number, Player[]>()
  for (const p of activePlayers) {
    const pts = pointsMap.get(p.id) ?? 0
    if (!groups.has(pts)) groups.set(pts, [])
    groups.get(pts)!.push(p)
  }
  const sorted: Player[] = [...groups.keys()]
    .sort((a, b) => b - a)
    .flatMap((pts) => shuffle(groups.get(pts)!))

  const forcedThreeTables = format === 'three-3' && sorted.length === 9
  const { sizes: automaticSizes, byes: automaticByes } = computeTableSizes(sorted.length)
  const sizes = forcedThreeTables ? [3, 3, 3] : automaticSizes
  const byeCount = forcedThreeTables ? 0 : automaticByes

  // Reparto de byes: primero quien menos byes ha tenido, luego menos puntos.
  const byes: string[] = []
  if (byeCount > 0) {
    const candidates = [...sorted].sort((a, b) => {
      const ba = byeCounts.get(a.id) ?? 0
      const bb = byeCounts.get(b.id) ?? 0
      if (ba !== bb) return ba - bb
      return (pointsMap.get(a.id) ?? 0) - (pointsMap.get(b.id) ?? 0)
    })
    for (let i = 0; i < byeCount; i++) byes.push(candidates[i].id)
  }

  const pool = sorted.filter((p) => !byes.includes(p.id))
  const tables: string[][] = []

  for (const size of sizes) {
    if (pool.length === 0) break
    const table: Player[] = [pool.shift()!]
    while (table.length < size && pool.length > 0) {
      const needed = size - table.length
      // Ventana de candidatos con puntuación cercana; damos holgura para poder
      // evitar repeticiones sin romper el emparejamiento por puntos.
      const windowSize = Math.min(pool.length, needed + 3)
      let bestIdx = 0
      let bestCost = Number.POSITIVE_INFINITY
      for (let i = 0; i < windowSize; i++) {
        const cand = pool[i]
        let cost = 0
        for (const member of table) {
          cost += meetings.get(pairKey(cand.id, member.id)) ?? 0
        }
        // Menor coste de repetición gana; a igualdad, el índice menor
        // (mayor puntuación) por preferir el orden suizo.
        if (cost < bestCost) {
          bestCost = cost
          bestIdx = i
        }
      }
      table.push(pool.splice(bestIdx, 1)[0])
    }
    tables.push(table.map((p) => p.id))
  }

  return { tables, byes }
}
