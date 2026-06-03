'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface DataPoint { name: string; value: number }
interface Props {
  data: DataPoint[]
  total?: number
  onSliceClick?: (estado: string) => void
}

const ESTADO_COLORS: Record<string, string> = {
  exitoso: '#34d399',     // Emerald 400
  completado: '#34d399',
  fallido: '#f87171',     // Red 400
  error: '#f87171',
  en_proceso: '#fbbf24',  // Amber 400
  en_progreso: '#fbbf24',
  pendiente: '#fbbf24',
  cancelado: '#9ca3af',   // Gray 400
}
const FALLBACK_COLORS = ['#34d399', '#f87171', '#fbbf24', '#9ca3af']

function getColor(name: string, index: number) {
  const key = name.toLowerCase().replace(/\s+/g, '_')
  return ESTADO_COLORS[key] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-[#18181b] border border-white/10 px-4 py-3 rounded-xl shadow-2xl">
      <p className="text-xs font-semibold text-gray-400 capitalize mb-1">
        {name}
      </p>
      <p className="text-xl font-bold text-white flex items-baseline gap-1">
        {value} <span className="text-gray-500 font-medium text-xs uppercase tracking-wider">despliegues</span>
      </p>
    </div>
  )
}

export default function DeploymentPieChart({ data, total = 0, onSliceClick }: Props) {
  return (
    <div className="relative flex h-full min-h-[240px] w-full max-w-[280px] items-center justify-center mx-auto">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="85%"
            paddingAngle={6}
            dataKey="value"
            stroke="none"
            cornerRadius={8}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getColor(entry.name, index)}
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => onSliceClick?.(entry.name)}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Etiqueta Central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-4xl font-black text-white tracking-tighter">{total}</span>
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Total</span>
      </div>
    </div>
  )
}
