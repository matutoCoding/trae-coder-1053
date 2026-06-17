import type { WaterLevelRecord } from '../types'
import { monitoringWells } from './wells'

const qualityFlags = ['合格', '合格', '合格', '合格', '合格', '合格', '待复核', '缺失补全', '异常']

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDateTime(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(6 + Math.floor(Math.random() * 18)).padStart(2, '0')
  const min = String(Math.floor(Math.random() * 60)).padStart(2, '0')
  const s = String(Math.floor(Math.random() * 60)).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

function generateWellWaterLevels(wellIndex: number): WaterLevelRecord[] {
  const well = monitoringWells[wellIndex]
  const baseline = well.baselineWaterLevel
  const records: WaterLevelRecord[] = []
  const startDate = new Date('2023-06-18')
  const totalDays = 1095

  for (let day = 0; day < totalDays; day++) {
    const currentDate = addDays(startDate, day)
    const dayOfYear = (currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / 86400000
    const yearIndex = Math.floor(day / 365)

    const seasonalComponent = Math.sin((dayOfYear / 365) * Math.PI * 2 - Math.PI / 2) * 2.5
    const trendComponent = yearIndex * 1.2 + (day % 365) * (1.2 / 365)
    const randomComponent = (Math.random() - 0.5) * 1.5

    let waterDepth = baseline + seasonalComponent + trendComponent + randomComponent

    const isAbnormal = Math.random() < 0.05
    if (isAbnormal) {
      const direction = Math.random() > 0.5 ? 1 : -1
      waterDepth += direction * (3 + Math.random() * 5)
    }

    const baseTemp = 16
    const seasonalTemp = Math.sin((dayOfYear / 365) * Math.PI * 2 - Math.PI / 3) * 6
    const waterTemp = parseFloat((baseTemp + seasonalTemp + (Math.random() - 0.5) * 1.5).toFixed(2))
    const conductivity = parseFloat((450 + Math.sin((dayOfYear / 365) * Math.PI * 2) * 120 + (Math.random() - 0.5) * 80).toFixed(1))

    const seq = String(wellIndex * totalDays + day + 1).padStart(7, '0')

    records.push({
      recordId: `WL-${seq}`,
      wellId: well.wellId,
      collectionTime: formatDateTime(currentDate),
      waterDepth: parseFloat(waterDepth.toFixed(2)),
      waterTemperature: waterTemp,
      conductivity,
      isAbnormal,
      qualityFlag: isAbnormal ? '待复核' : qualityFlags[Math.floor(Math.random() * qualityFlags.length)]
    })
  }

  return records
}

export const waterLevelRecords: WaterLevelRecord[] = monitoringWells.flatMap((_, i) => generateWellWaterLevels(i))
