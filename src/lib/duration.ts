export type Duration = '1s' | '1m' | '1h' | '1d' | '1w'

export function parseDuration(duration: Duration): number {
  const units: Record<string, number> = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
    'w': 7 * 24 * 60 * 60 * 1000
  }

  const match = duration.match(/^(\d+)([smhdw])$/)
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`)
  }

  const [, amount, unit] = match
  return parseInt(amount) * units[unit]
}