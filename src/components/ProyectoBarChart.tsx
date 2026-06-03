'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

interface ProyectoItem {
  proyecto: string
  total: number
}

interface Props {
  data: ProyectoItem[]
  onBarClick?: (proyecto: string) => void
}

const BAR_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4']

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#18181b] px-4 py-3 shadow-2xl">
      <p className="mb-1 text-xs font-semibold text-gray-400">{label}</p>
      <p className="flex items-baseline gap-1 text-xl font-bold text-white">
        {payload[0].value}{' '}
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">despliegues</span>
      </p>
    </div>
  )
}

export default function ProyectoBarChart({ data, onBarClick }: Props) {
  if (!data?.length) {
    return (
      <div className="flex h-full min-h-[250px] w-full items-center justify-center text-sm text-gray-500">
        Sin datos disponibles
      </div>
    )
  }

  return (
    <div className="h-[260px] w-full min-w-0 sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="proyecto"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
            dy={10}
            interval={0}
            angle={-12}
            textAnchor="end"
            height={56}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
          <Bar
            dataKey="total"
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
            onClick={(_bar, index) => {
              const item = data[index]
              if (item) onBarClick?.(item.proyecto)
            }}
            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={BAR_COLORS[index % BAR_COLORS.length]}
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
