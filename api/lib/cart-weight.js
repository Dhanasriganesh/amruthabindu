const DEFAULT_UNIT_KG = parseFloat(process.env.SHIPROCKET_DEFAULT_WEIGHT || '0.5')

export function parseWeightKg(value) {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value

  const text = String(value).toLowerCase().trim()
  const kgMatch = text.match(/(\d+(?:\.\d+)?)\s*kg\b/)
  if (kgMatch) return parseFloat(kgMatch[1])

  const gMatch = text.match(/(\d+(?:\.\d+)?)\s*g\b/)
  if (gMatch) return parseFloat(gMatch[1]) / 1000

  const numeric = parseFloat(text)
  return Number.isFinite(numeric) ? numeric : null
}

export function estimateCartWeightKg(items = []) {
  if (!items.length) return DEFAULT_UNIT_KG

  let total = 0
  for (const item of items) {
    const unitWeight =
      parseWeightKg(item.weight) ||
      parseWeightKg(item.size) ||
      DEFAULT_UNIT_KG
    total += unitWeight * (parseInt(item.quantity, 10) || 1)
  }

  return Math.max(0.1, Math.round(total * 100) / 100)
}
