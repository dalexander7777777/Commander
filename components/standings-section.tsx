'use client'

import { useTournament } from '@/components/tournament-provider'
import { Crown, Skull, Shield, Trophy } from 'lucide-react'

export function StandingsSection() {
  const { standings } = useTournament()

  const ranked = standings.filter((s) => s.gamesPlayed > 0 || s.points > 0)
  const showAll = ranked.length === 0 ? standings : ranked

  return (
    <section aria-labelledby="standings-heading" className="space-y-5">
      <div>
        <h2
          id="standings-heading"
          className="font-serif text-xl font-semibold tracking-wide"
        >
          Clasificación
        </h2>
        <p className="text-sm text-muted-foreground">
          Puntos acumulados de las rondas confirmadas.
        </p>
      </div>

      {showAll.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Añade jugadores y confirma alguna ronda para ver la tabla.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-border bg-secondary/40 px-4 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <span className="text-center">#</span>
            <span>Jugador</span>
            <span className="text-right">Puntos</span>
          </div>
          <ul>
            {showAll.map((s, i) => {
              const rank = i + 1
              const isPodium = s.gamesPlayed > 0 && rank <= 3
              return (
                <li
                  key={s.player.id}
                  className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <span className="flex justify-center">
                    {isPodium ? (
                      <Trophy
                        className={
                          rank === 1
                            ? 'size-4 text-primary'
                            : rank === 2
                              ? 'size-4 text-muted-foreground'
                              : 'size-4 text-accent'
                        }
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                        {rank}
                      </span>
                    )}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {s.player.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Crown className="size-3 text-primary" aria-hidden="true" />
                        {s.wins}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Skull
                          className="size-3 text-destructive"
                          aria-hidden="true"
                        />
                        {s.kills}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Shield className="size-3 text-accent" aria-hidden="true" />
                        {s.survivals}
                      </span>
                      <span className="opacity-70">
                        {s.gamesPlayed} partida{s.gamesPlayed === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  <span className="font-serif text-lg font-bold tabular-nums text-foreground">
                    {s.points}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
