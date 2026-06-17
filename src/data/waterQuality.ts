import type { WaterQualityRecord } from '../types'
import { monitoringWells } from './wells'

function determineWaterQuality(ph: number, tds: number, hardness: number, fluoride: number): string {
  let score = 1
  if (ph < 6.8 || ph > 8.2) score++
  if (tds > 1000) score++
  if (tds > 500) score += 0.5
  if (hardness > 450) score++
  if (hardness > 300) score += 0.5
  if (fluoride > 1.2) score += 2
  if (fluoride > 0.8) score++
  score = Math.round(score)
  score = Math.max(1, Math.min(5, score))
  const classes = ['I', 'II', 'III', 'IV', 'V']
  return `${classes[score - 1]}类`
}

function generateWellQualityRecords(wellIndex: number): WaterQualityRecord[] {
  const well = monitoringWells[wellIndex]
  const records: WaterQualityRecord[] = []
  const startYear = 2023
  const quarters = [
    { year: 2023, q: 2, month: 6, day: 15 },
    { year: 2023, q: 3, month: 9, day: 20 },
    { year: 2023, q: 4, month: 12, day: 18 },
    { year: 2024, q: 1, month: 3, day: 22 },
    { year: 2024, q: 2, month: 6, day: 17 },
    { year: 2024, q: 3, month: 9, day: 23 },
    { year: 2024, q: 4, month: 12, day: 19 },
    { year: 2025, q: 1, month: 3, day: 21 },
    { year: 2025, q: 2, month: 6, day: 16 },
    { year: 2025, q: 3, month: 9, day: 24 },
    { year: 2025, q: 4, month: 12, day: 17 },
    { year: 2026, q: 1, month: 3, day: 20 }
  ]

  const basePh = 7.2 + (wellIndex % 10) * 0.05
  const baseTds = 500 + (wellIndex % 20) * 40
  const baseHardness = 250 + (wellIndex % 15) * 25
  const baseFluoride = 0.4 + (wellIndex % 25) * 0.04

  quarters.forEach((q, idx) => {
    const phSeasonal = Math.sin((idx / 12) * Math.PI * 2) * 0.15
    const ph = parseFloat((basePh + phSeasonal + (Math.random() - 0.5) * 0.3).toFixed(2))
    const tds = parseFloat((baseTds + Math.sin((idx / 12) * Math.PI * 2) * 80 + (Math.random() - 0.5) * 150).toFixed(1))
    const hardness = parseFloat((baseHardness + Math.cos((idx / 12) * Math.PI * 2) * 50 + (Math.random() - 0.5) * 80).toFixed(1))
    const fluoride = parseFloat((baseFluoride + Math.sin((idx / 12) * Math.PI * 2 + 1) * 0.08 + (Math.random() - 0.5) * 0.15).toFixed(3))

    const phClamped = Math.max(6.5, Math.min(8.5, ph))
    const tdsClamped = Math.max(300, Math.min(1500, tds))
    const hardnessClamped = Math.max(150, Math.min(600, hardness))
    const fluorideClamped = Math.max(0.2, Math.min(1.5, fluoride))

    const seq = String(wellIndex * 12 + idx + 1).padStart(5, '0')

    records.push({
      recordId: `WQ-${seq}`,
      wellId: well.wellId,
      testDate: `${q.year}-${String(q.month).padStart(2, '0')}-${String(q.day).padStart(2, '0')}`,
      ph: phClamped,
      tds: tdsClamped,
      totalHardness: hardnessClamped,
      fluoride: fluorideClamped,
      waterQualityClass: determineWaterQuality(phClamped, tdsClamped, hardnessClamped, fluorideClamped)
    })
  })

  return records
}

export const waterQualityRecords: WaterQualityRecord[] = monitoringWells.flatMap((_, i) => generateWellQualityRecords(i))
