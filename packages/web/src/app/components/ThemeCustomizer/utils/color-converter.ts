export type ColorFormat = 'hsl' | 'rgb' | 'oklch' | 'hex'

export const colorFormatter = (colorValue: string, format: ColorFormat = 'oklch'): string => {
  if (!colorValue) return ''
  if (format === 'hex') {
    if (colorValue.startsWith('#')) return colorValue
    if (colorValue.startsWith('oklch') || colorValue.startsWith('hsl')) {
      return colorValue
    }
  }
  return colorValue
}

export const convertToHSL = (colorValue: string): string => colorFormatter(colorValue, 'hsl')
