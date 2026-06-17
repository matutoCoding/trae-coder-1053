import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

type ColorVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning'

interface StatCardProps {
  title: string
  value: number | string
  unit?: string
  icon: LucideIcon
  trend?: number
  color?: ColorVariant
}

const gradientMap: Record<ColorVariant, string> = {
  primary: 'from-[#0A2540] via-[#1A4B7C] to-[#2A6DB8]',
  secondary: 'from-[#00B8D9] via-[#26D0E8] to-[#5CE1F0]',
  success: 'from-[#228B22] via-[#2ECC40] to-[#34C759]',
  danger: 'from-[#B71C1C] via-[#E53935] to-[#FF3B30]',
  warning: 'from-[#B45309] via-[#F59E0B] to-[#FFCC00]',
}

const bgSoftMap: Record<ColorVariant, string> = {
  primary: 'bg-primary/5',
  secondary: 'bg-secondary/5',
  success: 'bg-success/5',
  danger: 'bg-danger/5',
  warning: 'bg-warning/5',
}

const textColorMap: Record<ColorVariant, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success',
  danger: 'text-danger',
  warning: 'text-warning',
}

const iconBgMap: Record<ColorVariant, string> = {
  primary: 'from-primary/90 to-primary/60',
  secondary: 'from-secondary/90 to-secondary/60',
  success: 'from-success/90 to-success/60',
  danger: 'from-danger/90 to-danger/60',
  warning: 'from-warning/90 to-warning/60',
}

export default function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  color = 'primary',
}: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0
  const hasTrend = trend !== undefined

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/40 bg-white p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(10,37,64,0.18)] ${bgSoftMap[color]}`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-20 ${gradientMap[color]}`}
      />
      <div
        className={`pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-gradient-to-tr opacity-5 blur-2xl transition-opacity duration-500 group-hover:opacity-10 ${gradientMap[color]}`}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-3 text-sm font-medium text-slate-500">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`bg-gradient-to-br bg-clip-text text-3xl font-bold leading-none tracking-tight text-transparent ${gradientMap[color]}`}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-slate-400">{unit}</span>
            )}
          </div>

          {hasTrend && (
            <div className="mt-3 flex items-center gap-1.5">
              <div
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                  isPositive
                    ? 'bg-success/10 text-success'
                    : 'bg-danger/10 text-danger'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(trend)}%</span>
              </div>
              <span className="text-xs text-slate-400">较上周</span>
            </div>
          )}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ${iconBgMap[color]}`}
          style={{
            boxShadow:
              color === 'secondary'
                ? '0 8px 20px -4px rgba(0, 184, 217, 0.45)'
                : color === 'success'
                  ? '0 8px 20px -4px rgba(52, 199, 89, 0.45)'
                  : color === 'danger'
                    ? '0 8px 20px -4px rgba(255, 59, 48, 0.45)'
                    : color === 'warning'
                      ? '0 8px 20px -4px rgba(255, 149, 0, 0.45)'
                      : '0 8px 20px -4px rgba(10, 37, 64, 0.45)',
          }}
        >
          <Icon className={`h-6 w-6 ${textColorMap[color] === 'text-secondary' ? 'text-white' : 'text-white'}`} />
        </div>
      </div>
    </div>
  )
}
