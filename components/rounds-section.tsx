'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTournament } from '@/components/tournament-provider'
import { TableCard } from '@/components/table-card'
import {
  Swords,
  Shuffle,
  Trash2,
  CircleCheckBig,
  Lock,
  Unlock,
  Coffee,
} from 'lucide-react'

export function RoundsSection() {
  const {
    state,
    createRound,
    regenerateRound,
    deleteRound,
    confirmRound,
    unconfirmRound,
  } = useTournament()
  const [message, setMessage] = useState<string | null>(null)
  const [tableFormat, setTableFormat] = useState<'auto' | 'three-3'>('auto')

  const nameOf = (id: string) =>
    state.players.find((p) => p.id === id)?.name ?? 'Desconocido'
  const activeCount = state.players.filter((p) => p.active).length

  const handleCreate = () => {
    const res = createRound(tableFormat)
    setMessage(res.ok ? null : (res.message ?? null))
  }

  const handleConfirm = (roundId: string) => {
    const res = confirmRound(roundId)
    setMessage(res.ok ? null : (res.message ?? null))
  }

  const rounds = [...state.rounds].reverse()

  return (
    <section aria-labelledby="rounds-heading" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="rounds-heading"
            className="font-serif text-xl font-semibold tracking-wide"
          >
            Rondas y mesas
          </h2>
          <p className="text-sm text-muted-foreground">
            Emparejamiento suizo: los líderes se enfrentan entre sí evitando
            repetir rivales.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="table-format">
            Formato de mesas
          </label>
          <select
            id="table-format"
            value={tableFormat}
            onChange={(event) =>
              setTableFormat(event.target.value as 'auto' | 'three-3')
            }
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="auto">Mesas automáticas</option>
            <option value="three-3">3 mesas de 3</option>
          </select>
          <Button
            size="lg"
            className="h-10 px-4"
            onClick={handleCreate}
            disabled={activeCount < 3}
          >
            <Swords data-icon="inline-start" />
            Nueva ronda
          </Button>
        </div>
      </div>

      {message && (
        <p
          role="status"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
        >
          {message}
        </p>
      )}

      {rounds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
          <Swords
            className="mx-auto mb-3 size-6 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            No hay rondas todavía. Pulsa{' '}
            <span className="font-medium text-foreground">Nueva ronda</span>{' '}
            para generar los emparejamientos.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {rounds.map((round) => (
            <article
              key={round.id}
              className="rounded-2xl border border-border bg-card/40 p-4 sm:p-5"
            >
              <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 font-serif text-sm font-bold text-primary tabular-nums">
                    {round.number}
                  </span>
                  <div>
                    <h3 className="font-serif text-base font-semibold">
                      Ronda {round.number}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {round.tables.length} mesa
                      {round.tables.length === 1 ? '' : 's'} ·{' '}
                      {round.confirmed ? 'confirmada' : 'en curso'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {round.confirmed ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unconfirmRound(round.id)}
                    >
                      <Unlock data-icon="inline-start" />
                      Reabrir
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => regenerateRound(round.id)}
                        title="Volver a generar mesas"
                      >
                        <Shuffle data-icon="inline-start" />
                        Regenerar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRound(round.id)}
                        aria-label={`Eliminar ronda ${round.number}`}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                      <Button size="sm" onClick={() => handleConfirm(round.id)}>
                        <CircleCheckBig data-icon="inline-start" />
                        Confirmar
                      </Button>
                    </>
                  )}
                </div>
              </header>

              {round.confirmed && (
                <p className="mb-4 flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-xs text-accent">
                  <Lock className="size-3.5" aria-hidden="true" />
                  Ronda confirmada y sumada a la clasificación. Reábrela para
                  editar resultados.
                </p>
              )}

              <div className="grid gap-3 lg:grid-cols-2">
                {round.tables.map((table, i) => (
                  <TableCard
                    key={table.id}
                    roundId={round.id}
                    table={table}
                    index={i}
                    nameOf={nameOf}
                    locked={round.confirmed}
                  />
                ))}
              </div>

              {round.byes.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border bg-background/40 px-4 py-3">
                  <Coffee
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    Descansan esta ronda:
                  </span>
                  {round.byes.map((id) => (
                    <span
                      key={id}
                      className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground"
                    >
                      {nameOf(id)}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
