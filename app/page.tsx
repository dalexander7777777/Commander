'use client'

import { useState } from 'react'
import { TournamentProvider, useTournament } from '@/components/tournament-provider'
import { PlayersSection } from '@/components/players-section'
import { RoundsSection } from '@/components/rounds-section'
import { StandingsSection } from '@/components/standings-section'
import { ScoringLegend } from '@/components/scoring-legend'
import { Button } from '@/components/ui/button'
import { Users, Swords, Trophy, RotateCcw } from 'lucide-react'

type Tab = 'jugadores' | 'rondas' | 'clasificacion'

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'jugadores', label: 'Jugadores', icon: Users },
  { id: 'rondas', label: 'Rondas', icon: Swords },
  { id: 'clasificacion', label: 'Clasificación', icon: Trophy },
]

function Shell() {
  const [tab, setTab] = useState<Tab>('jugadores')
  const { state, resetAll, hydrated } = useTournament()

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-24 sm:px-6">
      <header className="pt-8 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-medium tracking-[0.2em] text-primary uppercase">
              Magic · Commander
            </p>
            <h1 className="text-balance font-serif text-3xl font-bold tracking-wide sm:text-4xl">
              {state.name}
            </h1>
            <p className="mt-2 max-w-md text-pretty text-sm text-muted-foreground">
              Empareja mesas de 3 y 4, registra las partidas y sigue la carrera
              por el trono.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (
                confirm(
                  '¿Reiniciar todo el torneo? Se borrarán jugadores, rondas y puntos.'
                )
              ) {
                resetAll()
              }
            }}
            aria-label="Reiniciar torneo"
            title="Reiniciar torneo"
          >
            <RotateCcw />
          </Button>
        </div>

        <div className="mt-5">
          <ScoringLegend />
        </div>
      </header>

      <nav
        aria-label="Secciones"
        className="sticky top-0 z-10 -mx-4 mb-6 border-b border-border bg-background/80 px-4 backdrop-blur sm:-mx-6 sm:px-6"
      >
        <div className="flex gap-1">
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.icon className="size-4" aria-hidden="true" />
                {t.label}
                {active && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <main className="flex-1">
        {!hydrated ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            Cargando torneo…
          </div>
        ) : (
          <>
            {tab === 'jugadores' && <PlayersSection />}
            {tab === 'rondas' && <RoundsSection />}
            {tab === 'clasificacion' && <StandingsSection />}
          </>
        )}
      </main>
    </div>
  )
}

export default function Page() {
  return (
    <TournamentProvider>
      <Shell />
    </TournamentProvider>
  )
}
