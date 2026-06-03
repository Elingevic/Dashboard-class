import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#09090b',
}

export const metadata: Metadata = {
  title: 'Centro Gestión de despliegue · Control de Despliegue',
  description:
    'Dashboard analítico por trimestre: tasas de éxito, falla, rollback, evidencia, gobernanza y trazabilidad de commits.',
  keywords: [
    'despliegue',
    'dashboard',
    'devops',
    'trimestre',
    'rollback',
    'evidencia',
    'gobernanza',
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased overflow-x-hidden">{children}</body>
    </html>
  )
}
