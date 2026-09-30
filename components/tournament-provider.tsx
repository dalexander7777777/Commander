'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Player, Round, TournamentState, Table } from '@/lib/types'
import { computeStandings, pointsByPlayer } from '@/lib/scoring'
import { generateRoundTables } from '@/lib/pairing'

const STORAGE_KEY = 'commander-league:v1'

const EMPTY: TournamentState = {
  name: 'Liga Commander',
  players: [],
  rounds: [],
}

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

type Ctx = {
  state: TournamentState
  hydrated: boolean
  standings: ReturnType<typeof computeStandings>
  setName: (name: string) => void
  addPlayer: (name: string) => void
  renamePlayer: (id: string, name: string) => void
  removePlayer: (id: string) => void
  setPlayerActive: (id: string, active: boolean) => void
  createRound: (format?: 'auto' | 'three-3') => { ok: boolean; message?: string }
  regenerateRound: (roundId: string) => void
  deleteRound: (roundId: string) => void
  setTableResult: (roundId: string, tableId: string, result: Table['result']) => void
  confirmRound: (roundId: string) => { ok: boolean; message?: string }
  unconfirmRound: (roundId: string) => void
  resetAll: () => void
}

const TournamentContext = createContext<Ctx | null>(null)

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TournamentState>(EMPTY)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setState({ ...EMPTY, ...JSON.parse(raw) })
    } catch {
      // ignora estado corrupto
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignora cuota / modo privado
    }
  }, [state, hydrated])

  const standings = useMemo(
    () => computeStandings(state.players, state.rounds),
    [state.players, state.rounds]
  )

  const value = useMemo<Ctx>(() => {
    const setName = (name: string) => setState((s) => ({ ...s, name }))

    const addPlayer = (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      setState((s) => {
        if (
          s.players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())
        ) {
          return s
        }
        const player: Player = {
          id: uid(),
          name: trimmed,
          active: true,
          createdAt: Date.now(),
        }
        return { ...s, players: [...s.players, player] }
      })
    }

    const renamePlayer = (id: string, name: string) =>
      setState((s) => ({
        ...s,
        players: s.players.map((p) =>
          p.id === id ? { ...p, name: name.trim() || p.name } : p
        ),
      }))

    const removePlayer = (id: string) =>
      setState((s) => ({ ...s, players: s.players.filter((p) => p.id !== id) }))

    const setPlayerActive = (id: string, active: boolean) =>
      setState((s) => ({
        ...s,
        players: s.players.map((p) => (p.id === id ? { ...p, active } : p)),
      }))

    const buildTables = (
      activePlayers: Player[],
      previousRounds: Round[],
      format: 'auto' | 'three-3' = 'auto'
    ): { tables: Table[]; byes: string[]; playerIds: string[] } => {
      const points = pointsByPlayer(
        activePlayers,
        previousRounds.filter((r) => r.confirmed)
      )
      const gen = generateRoundTables(activePlayers, points, previousRounds, format)
      const tables: Table[] = gen.tables.map((seats) => ({
        id: uid(),
        seats,
        result: null,
      }))
      return {
        tables,
        byes: gen.byes,
        playerIds: activePlayers.map((p) => p.id),
      }
    }

    const createRound = (format: 'auto' | 'three-3' = 'auto'): { ok: boolean; message?: string } => {
      let result: { ok: boolean; message?: string } = { ok: true }
      setState((s) => {
        const active = s.players.filter((p) => p.active)
        if (active.length < 3) {
          result = {
            ok: false,
            message: 'Necesitas al menos 3 jugadores activos para una ronda.',
          }
          return s
        }
        if (format === 'three-3' && active.length !== 9) {
          result = {
            ok: false,
            message: 'El formato 3 mesas de 3 requiere exactamente 9 jugadores activos.',
          }
          return s
        }
        const built = buildTables(active, s.rounds, format)
        const round: Round = {
          id: uid(),
          number: s.rounds.length + 1,
          createdAt: Date.now(),
          playerIds: built.playerIds,
          byes: built.byes,
          tables: built.tables,
          confirmed: false,
        }
        return { ...s, rounds: [...s.rounds, round] }
      })
      return result
    }

    const regenerateRound = (roundId: string) =>
      setState((s) => {
        const round = s.rounds.find((r) => r.id === roundId)
        if (!round || round.confirmed) return s
        const participants = s.players.filter((p) =>
          round.playerIds.includes(p.id)
        )
        const others = s.rounds.filter((r) => r.id !== roundId)
        const built = buildTables(participants, others)
        return {
          ...s,
          rounds: s.rounds.map((r) =>
            r.id === roundId
              ? { ...r, tables: built.tables, byes: built.byes }
              : r
          ),
        }
      })

    const deleteRound = (roundId: string) =>
      setState((s) => ({
        ...s,
        rounds: s.rounds
          .filter((r) => r.id !== roundId)
          .map((r, i) => ({ ...r, number: i + 1 })),
      }))

    const setTableResult = (
      roundId: string,
      tableId: string,
      resultValue: Table['result']
    ) =>
      setState((s) => ({
        ...s,
        rounds: s.rounds.map((r) =>
          r.id === roundId
            ? {
                ...r,
                tables: r.tables.map((t) =>
                  t.id === tableId ? { ...t, result: resultValue } : t
                ),
              }
            : r
        ),
      }))

    const confirmRound = (roundId: string): { ok: boolean; message?: string } => {
      let result: { ok: boolean; message?: string } = { ok: true }
      setState((s) => {
        const round = s.rounds.find((r) => r.id === roundId)
        if (!round) return s
        const missing = round.tables.some((t) => t.result === null)
        if (missing) {
          result = {
            ok: false,
            message: 'Registra el resultado de todas las mesas antes de confirmar.',
          }
          return s
        }
        return {
          ...s,
          rounds: s.rounds.map((r) =>
            r.id === roundId ? { ...r, confirmed: true } : r
          ),
        }
      })
      return result
    }

    const unconfirmRound = (roundId: string) =>
      setState((s) => ({
        ...s,
        rounds: s.rounds.map((r) =>
          r.id === roundId ? { ...r, confirmed: false } : r
        ),
      }))

    const resetAll = () => setState(EMPTY)

    return {
      state,
      hydrated,
      standings,
      setName,
      addPlayer,
      renamePlayer,
      removePlayer,
      setPlayerActive,
      createRound,
      regenerateRound,
      deleteRound,
      setTableResult,
      confirmRound,
      unconfirmRound,
      resetAll,
    }
  }, [state, hydrated, standings])

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  )
}

export function useTournament(): Ctx {
  const ctx = useContext(TournamentContext)
  if (!ctx) {
    throw new Error('useTournament debe usarse dentro de TournamentProvider')
  }
  return ctx
}
