import type { Player, Round, Standing, SeatResult } from './types'

export const POINTS = {
  WIN: 3,
  KILL: 1,
  SURVIVE: 1,
} as const

/** Puntos de un jugador en una mesa concreta. */
export function seatPoints(entry: SeatResult, isWinner: boolean): number {
  const points =
    (isWinner ? POINTS.WIN : 0) +
    entry.kills * POINTS.KILL +
    (entry.survived ? POINTS.SURVIVE : 0)

  // Una victoria vale como máximo 3 puntos, incluyendo kills y supervivencia.
  return isWinner ? Math.min(POINTS.WIN, points) : points
}

/**
 * Calcula la clasificación a partir de las rondas confirmadas.
 * Desempates: puntos → victorias → kills → menos partidas jugadas → nombre.
 */
export function computeStandings(players: Player[], rounds: Round[]): Standing[] {
  const map = new Map<string, Standing>()
  for (const p of players) {
    map.set(p.id, {
      player: p,
      points: 0,
      wins: 0,
      kills: 0,
      survivals: 0,
      gamesPlayed: 0,
    })
  }

  for (const round of rounds) {
    if (!round.confirmed) continue
    for (const table of round.tables) {
      if (!table.result) continue
      const { winnerId, entries } = table.result
      for (const entry of entries) {
        const s = map.get(entry.playerId)
        if (!s) continue
        const isWinner = winnerId === entry.playerId
        s.points += seatPoints(entry, isWinner)
        s.kills += entry.kills
        if (isWinner) s.wins += 1
        if (entry.survived) s.survivals += 1
        s.gamesPlayed += 1
      }
    }
  }

  return [...map.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.kills !== a.kills) return b.kills - a.kills
    if (a.gamesPlayed !== b.gamesPlayed) return a.gamesPlayed - b.gamesPlayed
    return a.player.name.localeCompare(b.player.name)
  })
}

/** Puntos actuales por jugador (mapa id -> puntos) usando rondas confirmadas. */
export function pointsByPlayer(players: Player[], rounds: Round[]): Map<string, number> {
  const standings = computeStandings(players, rounds)
  const map = new Map<string, number>()
  for (const s of standings) map.set(s.player.id, s.points)
  return map
}
