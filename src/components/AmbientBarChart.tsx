'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

interface AmbienteItem {
  ambiente: string
  total: number
}

interface Props {
  data: AmbienteItem[]
  onBarClick?: (ambiente: string) => void
}

const BAR_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#18181b] border border-white/10 px-4 py-3 rounded-xl shadow-2xl">
      <p className="text-xs font-semibold text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-white flex items-baseline gap-1">
        {payload[0].value} <span className="text-gray-500 font-medium text-xs uppercase tracking-wider">despliegues</span>
      </p>
    </div>
  )
}

export default function AmbientBarChart({ data, onBarClick }: Props) {
  if (!data || data.length === 0) {
    return <div className="w-full h-full min-h-[250px] flex items-center justify-center text-gray-500 text-sm">Sin datos disponibles</div>
  }

  return (
    <div className="h-[220px] w-full min-w-0 sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 8, left: 0, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="ambiente"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }}
            angle={-35}
            textAnchor="end"
            height={56}
            dy={4}
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
            maxBarSize={50}
            onClick={(_bar, index) => {
              const item = data[index]
              if (item) onBarClick?.(item.ambiente)
            }}
            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={BAR_COLORS[index % BAR_COLORS.length]} 
                className="transition-all duration-300 hover:opacity-80 cursor-pointer"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
