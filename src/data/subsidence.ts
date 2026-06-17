import type { SubsidenceStation, SubsidenceRecord } from '../types'
import { monitoringWells } from './wells'

const stationAreas = [
  '新街口核心区', '鼓楼中心区', '河西新城', '江北新区', '江宁大学城',
  '麒麟科创园', '仙林副城', '雨花软件谷', '燕子矶新城', '南部新城',
  '浦口新城', '板桥新城', '迈皋桥片区', '红山新城', '紫东片区',
  '禄口空港', '滨江开发区', '龙潭新城', '汤山新城', '湖熟新城'
]

function generateSubsidenceStations(): SubsidenceStation[] {
  const stations: SubsidenceStation[] = []
  const usedWellIndices = new Set<number>()

  for (let i = 0; i < 20; i++) {
    let wellIdx: number
    do {
      wellIdx = Math.floor(Math.random() * monitoringWells.length)
    } while (usedWellIndices.has(wellIdx))
    usedWellIndices.add(wellIdx)

    const relatedWell = monitoringWells[wellIdx]
    const lng = relatedWell.longitude + (Math.random() - 0.5) * 0.02
    const lat = relatedWell.latitude + (Math.random() - 0.5) * 0.02
    const initialElevation = parseFloat((15 + Math.random() * 25).toFixed(3))
    const seqNum = String(i + 1).padStart(3, '0')

    stations.push({
      stationId: `CJ-${seqNum}`,
      stationName: `${stationAreas[i]}沉降监测点${seqNum}号`,
      longitude: parseFloat(lng.toFixed(6)),
      latitude: parseFloat(lat.toFixed(6)),
      initialElevation,
      relatedWellId: relatedWell.wellId
    })
  }

  return stations
}

export const subsidenceStations: SubsidenceStation[] = generateSubsidenceStations()

function generateStationRecords(stationIndex: number): SubsidenceRecord[] {
  const station = subsidenceStations[stationIndex]
  const relatedWell = monitoringWells.find(w => w.wellId === station.relatedWellId)!
  const baselineLevel = relatedWell.baselineWaterLevel

  const subsidenceCoeff = 0.8 + (stationIndex % 5) * 0.15
  const monthlyMax = baselineLevel > 30 ? 0.9 : baselineLevel > 22 ? 0.6 : 0.4

  const records: SubsidenceRecord[] = []
  const startDate = new Date('2023-06-01')
  const totalMonths = 36

  let cumulativeSubsidence = 0
  const monthlySubsidences: number[] = []

  for (let month = 0; month < totalMonths; month++) {
    const currentDate = new Date(startDate)
    currentDate.setMonth(currentDate.getMonth() + month)

    const seasonalComp = Math.sin((month / 12) * Math.PI * 2 - Math.PI / 4) * monthlyMax * 0.3
    const trendComp = monthlyMax * (0.6 + (stationIndex % 4) * 0.1)
    const randomComp = (Math.random() - 0.5) * monthlyMax * 0.4

    let monthlySub = (seasonalComp + trendComp + randomComp) * subsidenceCoeff
    monthlySub = Math.max(0.1, monthlySub)
    monthlySubsidences.push(monthlySub)

    cumulativeSubsidence += monthlySub
    cumulativeSubsidence = Math.min(300, cumulativeSubsidence)

    const currentElevation = parseFloat((station.initialElevation - cumulativeSubsidence / 1000).toFixed(3))

    const yearStartIdx = Math.floor(month / 12) * 12
    let annualSubsidence = 0
    for (let m = yearStartIdx; m <= month && m < yearStartIdx + 12; m++) {
      annualSubsidence += monthlySubsidences[m]
    }

    const y = currentDate.getFullYear()
    const m = String(currentDate.getMonth() + 1).padStart(2, '0')
    const d = String(15 + Math.floor(Math.random() * 10)).padStart(2, '0')

    const seq = String(stationIndex * totalMonths + month + 1).padStart(5, '0')

    records.push({
      recordId: `SR-${seq}`,
      stationId: station.stationId,
      measureDate: `${y}-${m}-${d}`,
      currentElevation,
      cumulativeSubsidence: parseFloat(cumulativeSubsidence.toFixed(2)),
      annualSubsidence: parseFloat(annualSubsidence.toFixed(2))
    })
  }

  return records
}

export const subsidenceRecords: SubsidenceRecord[] = subsidenceStations.flatMap((_, i) => generateStationRecords(i))
