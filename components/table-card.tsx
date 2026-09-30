'use client'

import { Button } from '@/components/ui/button'
import { useTournament } from '@/components/tournament-provider'
import { seatPoints } from '@/lib/scoring'
import type { Table, SeatResult } from '@/lib/types'
import { Crown, Skull, Shield, Minus, Plus } from 'lucide-react'

function defaultEntries(seats: string[]): SeatResult[] {
  return seats.map((playerId) => ({ playerId, kills: 0, survived: false }))
}

export function TableCard({
  roundId,
  table,
  index,
  nameOf,
  locked,
}: {
  roundId: string
  table: Table
  index: number
  nameOf: (id: string) => string
  locked: boolean
}) {
  const { setTableResult } = useTournament()

  const result = table.result ?? {
    winnerId: null,
    entries: defaultEntries(table.seats),
  }

  const update = (next: Table['result']) => {
    if (locked) return
    setTableResult(roundId, table.id, next)
  }

  const setWinner = (playerId: string) => {
    const winnerId = result.winnerId === playerId ? null : playerId
    // El ganador siempre sobrevive.
    const entries = result.entries.map((e) =>
      e.playerId === winnerId ? { ...e, survived: true } : e
    )
    update({ winnerId, entries })
  }

  const setKills = (playerId: string, delta: number) => {
    const entries = result.entries.map((e) =>
      e.playerId === playerId
        ? { ...e, kills: Math.max(0, Math.min(3, e.kills + delta)) }
        : e
    )
    update({ ...result, entries })
  }

  const toggleSurvived = (playerId: string) => {
    if (result.winnerId === playerId) return // ganador siempre sobrevive
    const entries = result.entries.map((e) =>
      e.playerId === playerId ? { ...e, survived: !e.survived } : e
    )
    update({ ...result, entries })
  }

  const hasResult = table.result !== null

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-2.5">
        <h4 className="font-serif text-sm font-semibold tracking-wide">
          Mesa {index + 1}
          <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">
            {table.seats.length} jugadores
          </span>
        </h4>
        {hasResult && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
            Registrada
          </span>
        )}
      </div>

      <ul className="divide-y divide-border">
        {result.entries.map((entry) => {
          const isWinner = result.winnerId === entry.playerId
          const pts = seatPoints(entry, isWinner)
          return (
            <li
              key={entry.playerId}
              className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 ${
                isWinner ? 'bg-primary/5' : ''
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {nameOf(entry.playerId)}
                </span>
                <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                  {pts} pt{pts === 1 ? '' : 's'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Ganador */}
                <Button
                  size="icon-sm"
                  variant={isWinner ? 'default' : 'outline'}
                  onClick={() => setWinner(entry.playerId)}
                  disabled={locked}
                  aria-pressed={isWinner}
                  aria-label={`Marcar ganador: ${nameOf(entry.playerId)}`}
                  title="Ganador (+3)"
                >
                  <Crown />
                </Button>

                {/* Sobrevivió */}
                <Button
                  size="icon-sm"
                  variant={entry.survived ? 'secondary' : 'outline'}
                  onClick={() => toggleSurvived(entry.playerId)}
                  disabled={locked || isWinner}
                  aria-pressed={entry.survived}
                  aria-label={`Sobrevivió: ${nameOf(entry.playerId)}`}
                  title="Sobrevivió (+1)"
                >
                  <Shield className={entry.survived ? 'text-accent' : ''} />
                </Button>

                {/* Kills */}
                <div className="flex items-center gap-1 rounded-lg border border-border bg-background px-1">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => setKills(entry.playerId, -1)}
                    disabled={locked}
                    aria-label={`Menos kill: ${nameOf(entry.playerId)}`}
                  >
                    <Minus />
                  </Button>
                  <span className="flex items-center gap-1 text-xs font-semibold tabular-nums">
                    <Skull
                      className="size-3.5 text-destructive"
                      aria-hidden="true"
                    />
                    {entry.kills}
                  </span>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => setKills(entry.playerId, 1)}
                    disabled={locked}
                    aria-label={`Más kill: ${nameOf(entry.playerId)}`}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
