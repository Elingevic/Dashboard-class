'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#09090b] p-6 text-gray-200">
        <h2 className="text-xl font-bold">Error en el dashboard</h2>
        <p className="max-w-md text-center text-sm text-gray-400">
          {error.message || 'No se pudo cargar la aplicación.'}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Reintentar
        </button>
      </body>
    </html>
  )
}
