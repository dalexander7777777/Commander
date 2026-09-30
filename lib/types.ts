export type Player = {
  id: string
  name: string
  /** Si está activo entra en la generación de rondas. Roster flexible por ronda. */
  active: boolean
  createdAt: number
}

/** Resultado individual de un jugador en una mesa. */
export type SeatResult = {
  playerId: string
  kills: number
  survived: boolean
}

export type Table = {
  id: string
  /** Ids de jugadores sentados en la mesa (3 o 4). */
  seats: string[]
  /** Si es null, la mesa aún no tiene resultado registrado. */
  result: {
    winnerId: string | null
    entries: SeatResult[]
  } | null
}

export type Round = {
  id: string
  number: number
  createdAt: number
  /** Jugadores que participaron en esta ronda (incluye byes fuera de tables). */
  playerIds: string[]
  /** Jugadores que quedaron sin mesa (bye) porque el número no cerraba. */
  byes: string[]
  tables: Table[]
  /** Una ronda confirmada ya cuenta para la clasificación. */
  confirmed: boolean
}

export type TournamentState = {
  name: string
  players: Player[]
  rounds: Round[]
}

/** Puntuación acumulada derivada de las rondas confirmadas. */
export type Standing = {
  player: Player
  points: number
  wins: number
  kills: number
  survivals: number
  gamesPlayed: number
}
