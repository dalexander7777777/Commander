'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTournament } from '@/components/tournament-provider'
import { UserPlus, Trash2, Check, X, Pencil } from 'lucide-react'

export function PlayersSection() {
  const { state, addPlayer, removePlayer, setPlayerActive, renamePlayer } =
    useTournament()
  const [name, setName] = useState('')
  const [bulkNames, setBulkNames] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const activeCount = state.players.filter((p) => p.active).length

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    addPlayer(name)
    setName('')
  }

  const submitBulk = (e: React.FormEvent) => {
    e.preventDefault()
    bulkNames
      .split(/\r?\n/)
      .map((playerName) => playerName.trim())
      .filter(Boolean)
      .forEach((playerName) => addPlayer(playerName))
    setBulkNames('')
  }

  const startEdit = (id: string, current: string) => {
    setEditingId(id)
    setEditValue(current)
  }
  const commitEdit = () => {
    if (editingId) renamePlayer(editingId, editValue)
    setEditingId(null)
  }

  return (
    <section aria-labelledby="players-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="players-heading"
            className="font-serif text-xl font-semibold tracking-wide"
          >
            Jugadores
          </h2>
          <p className="text-sm text-muted-foreground">
            {state.players.length} en el roster · {activeCount} activos para la
            próxima ronda
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1">
          <UserPlus
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del planeswalker…"
            aria-label="Nombre del jugador"
            className="h-10 w-full rounded-lg border border-border bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          />
        </div>
        <Button type="submit" size="lg" className="h-10 px-4">
          Añadir
        </Button>
      </form>

      <form onSubmit={submitBulk} className="space-y-2 rounded-xl border border-border bg-card/50 p-3">
        <label htmlFor="bulk-player-names" className="text-sm font-medium">
          Añadir varios jugadores
        </label>
        <textarea
          id="bulk-player-names"
          value={bulkNames}
          onChange={(e) => setBulkNames(e.target.value)}
          placeholder={'Un nombre por línea…\nJace\nLiliana\nChandra'}
          rows={4}
          className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Se ignoran líneas vacías.</p>
          <Button type="submit" variant="secondary" disabled={!bulkNames.trim()}>
            Añadir lista
          </Button>
        </div>
      </form>

      {state.players.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no hay jugadores. Añade a los comandantes de tu mesa para
            empezar.
          </p>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {state.players.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
            >
              <button
                type="button"
                role="switch"
                aria-checked={p.active}
                aria-label={p.active ? 'Marcar inactivo' : 'Marcar activo'}
                onClick={() => setPlayerActive(p.id, !p.active)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  p.active ? 'bg-accent' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full bg-background transition-all ${
                    p.active ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </button>

              {editingId === p.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return
                    if (e.key === 'Enter') commitEdit()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-sm outline-none focus-visible:border-ring"
                  aria-label="Editar nombre"
                />
              ) : (
                <span
                  className={`flex-1 truncate text-sm font-medium ${
                    p.active ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {p.name}
                </span>
              )}

              {editingId === p.id ? (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={commitEdit}
                  aria-label="Guardar nombre"
                >
                  <Check className="text-accent" />
                </Button>
              ) : (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => startEdit(p.id, p.name)}
                  aria-label={`Editar ${p.name}`}
                >
                  <Pencil />
                </Button>
              )}
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => removePlayer(p.id)}
                aria-label={`Eliminar ${p.name}`}
              >
                <Trash2 className="text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {activeCount < 3 && state.players.length > 0 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <X className="size-4 text-destructive" aria-hidden="true" />
          Necesitas al menos 3 jugadores activos para generar una ronda.
        </p>
      )}
    </section>
  )
}
