'use client'

import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  accentColor: string
  delay?: number
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  accentColor,
  delay = 0,
}: StatCardProps) {
  const delayClass =
    delay === 1
      ? 'fade-in-up-delay-1'
      : delay === 2
        ? 'fade-in-up-delay-2'
        : delay === 3
          ? 'fade-in-up-delay-3'
          : 'fade-in-up'

  return (
    <article
      id={`stat-card-${title.replace(/\s+/g, '-').toLowerCase()}`}
      className={`stat-card fade-in-up ${delayClass}`}
      style={{ borderTop: `3px solid ${accentColor}` }}
      aria-label={`${title}: ${value}`}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
        style={{ background: `${accentColor}1a`, color: accentColor }}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Value */}
      <p className="text-3xl font-bold text-text-primary leading-none mb-1">
        {value}
      </p>

      {/* Title */}
      <p className="text-sm font-semibold text-text-secondary mt-2">{title}</p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-text-secondary mt-1 opacity-70">{subtitle}</p>
      )}
    </article>
  )
}
