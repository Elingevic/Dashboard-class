/** Quita acentos y pasa a minúsculas (misma lógica que translate en SQL). */
const ACCENT_FROM = 'áéíóúàèìòùäëïöüñç'
const ACCENT_TO = 'aeiouaeiouaeiounc'

export function normalizeForSearch(text: string): string {
  const lower = text.toLowerCase().trim()
  let out = ''
  for (const ch of lower) {
    const idx = ACCENT_FROM.indexOf(ch)
    out += idx >= 0 ? ACCENT_TO[idx] : ch
  }
  return out.replace(/\s+/g, ' ')
}

/** Expresión SQL que normaliza un campo de texto para comparar sin acentos ni mayúsculas. */
export function sqlNormalizeField(columnExpr: string): string {
  return `translate(LOWER(COALESCE(${columnExpr}, '')), '${ACCENT_FROM}', '${ACCENT_TO}')`
}
