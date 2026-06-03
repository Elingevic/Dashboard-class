'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, ShieldAlert } from 'lucide-react'

interface Props {
  porcentaje: number
  conEvidencia: number
  sinEvidencia: number
}

export default function EvidenciaGauge({ porcentaje, conEvidencia, sinEvidencia }: Props) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  // Limitar porcentaje entre 0 y 100
  const validPct = Math.min(100, Math.max(0, porcentaje))
  const strokeDashoffset = circumference - (validPct / 100) * circumference

  const isHealthy = validPct >= 80

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative flex items-center justify-center w-48 h-48">
        
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="96"
            cy="96"
            r={radius}
            stroke={isHealthy ? '#3b82f6' : '#f59e0b'} // Blue if healthy, amber if warning
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Inner Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white">{validPct}%</span>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Cobertura</span>
        </div>
      </div>

      {/* Stats Below Gauge */}
      <div className="w-full flex justify-between px-4 mt-6">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-blue-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xl font-bold">{conEvidencia}</span>
          </div>
          <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Con evidencia</span>
        </div>
        
        <div className="w-px h-8 bg-white/10" />
        
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-amber-500">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xl font-bold">{sinEvidencia}</span>
          </div>
          <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Sin evidencia</span>
        </div>
      </div>
    </div>
  )
}
