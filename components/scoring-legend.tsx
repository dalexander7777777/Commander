import { Crown, Skull, Shield } from 'lucide-react'

const RULES = [
  { icon: Crown, label: 'Victoria', points: 3, color: 'text-primary' },
  { icon: Skull, label: 'Kill', points: 1, color: 'text-destructive' },
  { icon: Shield, label: 'Sobrevivir', points: 1, color: 'text-accent' },
]

export function ScoringLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {RULES.map((r) => (
        <div
          key={r.label}
          className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5"
        >
          <r.icon className={`size-4 ${r.color}`} aria-hidden="true" />
          <span className="text-sm text-muted-foreground">{r.label}</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            +{r.points}
          </span>
        </div>
      ))}
    </div>
  )
}
