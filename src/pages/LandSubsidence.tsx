import React, { useMemo, useState } from 'react'
import {
  AlertTriangle,
  TrendingDown,
  MapPin,
  Activity,
  Layers,
  Target,
  Gauge,
  AlertCircle,
  ChevronDown,
  ShieldAlert,
  Radio,
  Droplets,
  ArrowRight,
  Info,
  CheckCircle2,
  Siren,
  Zap
} from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts/core'
import {
  ScatterChart,
  EffectScatterChart,
  PieChart,
  BarChart,
  LineChart,
  CustomChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  VisualMapComponent,
  GraphicComponent,
  MarkLineComponent,
  MarkAreaComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { subsidenceStations, subsidenceRecords } from '@/data/subsidence'
import { monitoringWells as wells } from '@/data/wells'
import { waterLevelRecords } from '@/data/waterLevel'
import StatCard from '@/components/StatCard'

echarts.use([
  ScatterChart,
  EffectScatterChart,
  PieChart,
  BarChart,
  LineChart,
  CustomChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  VisualMapComponent,
  GraphicComponent,
  MarkLineComponent,
  MarkAreaComponent,
  CanvasRenderer
])

type RiskLevel = '低风险' | '中风险' | '高风险' | '极高风险'

interface StationStats {
  stationId: string
  stationName: string
  longitude: number
  latitude: number
  relatedWellId: string
  cumulativeSubsidence: number
  annualSubsidenceRate: number
  lastElevation: number
  avgWaterDepth: number
  riskLevel: RiskLevel
}

function getRiskLevel(annualRate: number): RiskLevel {
  if (annualRate < 5) return '低风险'
  if (annualRate < 15) return '中风险'
  if (annualRate < 30) return '高风险'
  return '极高风险'
}

function getRateColor(rate: number): string {
  if (rate < 5) return '#34C759'
  if (rate < 15) return '#FFCC00'
  if (rate < 30) return '#FF9500'
  return '#FF3B30'
}

function getRiskColor(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    '低风险': '#34C759',
    '中风险': '#FFCC00',
    '高风险': '#FF9500',
    '极高风险': '#FF3B30'
  }
  return map[level]
}

function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number; r: number } {
  const n = x.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
  for (let i = 0; i < n; i++) {
    sumX += x[i]
    sumY += y[i]
    sumXY += x[i] * y[i]
    sumX2 += x[i] * x[i]
    sumY2 += y[i] * y[i]
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  const ssRes = y.reduce((acc, yi, i) => acc + Math.pow(yi - (slope * x[i] + intercept), 2), 0)
  const meanY = sumY / n
  const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - meanY, 2), 0)
  const r2 = 1 - ssRes / ssTot
  const r = (n * sumXY - sumX * sumY) / Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  return { slope, intercept, r2, r }
}

export default function LandSubsidence() {
  const [selectedStationId, setSelectedStationId] = useState<string>(subsidenceStations[0]?.stationId || '')

  const stationStatsMap = useMemo(() => {
    const map = new Map<string, StationStats>()

    subsidenceStations.forEach(station => {
      const stationRecords = subsidenceRecords.filter(r => r.stationId === station.stationId)
      const latestRecord = stationRecords[stationRecords.length - 1]
      const oldestRecord = stationRecords[0]
      const totalMonths = stationRecords.length
      const cumulative = latestRecord?.cumulativeSubsidence || 0
      const annualRate = totalMonths >= 12 ? (cumulative / (totalMonths / 12)) : cumulative

      const relatedRecords = waterLevelRecords.filter(r => r.wellId === station.relatedWellId)
      const avgWaterDepth = relatedRecords.length > 0
        ? relatedRecords.reduce((acc, r) => acc + r.waterDepth, 0) / relatedRecords.length
        : 0

      map.set(station.stationId, {
        stationId: station.stationId,
        stationName: station.stationName,
        longitude: station.longitude,
        latitude: station.latitude,
        relatedWellId: station.relatedWellId,
        cumulativeSubsidence: cumulative,
        annualSubsidenceRate: parseFloat(annualRate.toFixed(2)),
        lastElevation: latestRecord?.currentElevation || station.initialElevation,
        avgWaterDepth: parseFloat(avgWaterDepth.toFixed(2)),
        riskLevel: getRiskLevel(annualRate)
      })
    })

    return map
  }, [])

  const stationStats = useMemo(() => Array.from(stationStatsMap.values()), [stationStatsMap])

  const maxCumulativeStation = useMemo(() => {
    let max: StationStats | null = null
    stationStats.forEach(s => {
      if (!max || s.cumulativeSubsidence > max.cumulativeSubsidence) max = s
    })
    return max
  }, [stationStats])

  const avgAnnualRate = useMemo(() => {
    if (stationStats.length === 0) return 0
    const sum = stationStats.reduce((acc, s) => acc + s.annualSubsidenceRate, 0)
    return parseFloat((sum / stationStats.length).toFixed(2))
  }, [stationStats])

  const highRiskCount = useMemo(() => {
    return stationStats.filter(s => s.annualSubsidenceRate > 10).length
  }, [stationStats])

  const estimatedArea = useMemo(() => {
    const highRateStations = stationStats.filter(s => s.annualSubsidenceRate > 5).length
    return parseFloat((highRateStations * 2.8).toFixed(1))
  }, [stationStats])

  const gisOption = useMemo(() => {
    const scatterData = stationStats.map(s => ({
      name: s.stationName,
      value: [
        s.longitude,
        s.latitude,
        s.cumulativeSubsidence,
        s.stationId,
        s.stationName,
        s.cumulativeSubsidence,
        s.annualSubsidenceRate,
        s.lastElevation,
        s.avgWaterDepth
      ],
      itemStyle: {
        color: getRateColor(s.annualSubsidenceRate),
        shadowBlur: 12,
        shadowColor: getRateColor(s.annualSubsidenceRate),
        opacity: 0.92
      }
    }))

    const heatData = stationStats.filter(s => s.annualSubsidenceRate >= 10).map(s => [
      s.longitude,
      s.latitude,
      s.annualSubsidenceRate
    ])

    return {
      backgroundColor: {
        type: 'radial',
        x: 0.5, y: 0.5, r: 0.9,
        colorStops: [
          { offset: 0, color: '#F0F9FF' },
          { offset: 0.5, color: '#E0F2FE' },
          { offset: 1, color: '#BAE6FD' }
        ]
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: [14, 18],
        textStyle: { color: '#374151', fontSize: 12 },
        formatter: (params: any) => {
          if (params.seriesType === 'effectScatter') return ''
          const d = params.data.value
          return `
            <div style="font-weight:700;font-size:14px;margin-bottom:10px;color:#111827;border-bottom:1px solid #E5E7EB;padding-bottom:8px;">
              ${d[4]}
            </div>
            <div style="font-size:12px;line-height:2;">
              <div style="display:flex;justify-content:space-between;gap:24px;">
                <span style="color:#6B7280;">累计沉降:</span>
                <span style="font-weight:600;color:#1F2937;">${d[5].toFixed(2)} mm</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;">
                <span style="color:#6B7280;">年沉降速率:</span>
                <span style="font-weight:600;color:${getRateColor(d[6])};">${d[6].toFixed(2)} mm/年</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;">
                <span style="color:#6B7280;">最近高程:</span>
                <span style="font-weight:600;color:#1F2937;">${d[7].toFixed(3)} m</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;">
                <span style="color:#6B7280;">平均水位埋深:</span>
                <span style="font-weight:600;color:#0EA5E9;">${d[8].toFixed(2)} m</span>
              </div>
            </div>
          `
        }
      },
      legend: {
        show: true,
        right: 20,
        top: 20,
        orient: 'vertical',
        backgroundColor: 'rgba(255,255,255,0.94)',
        borderRadius: 10,
        textStyle: { color: '#374151', fontSize: 12, fontWeight: 500 },
        itemGap: 14,
        itemWidth: 14,
        itemHeight: 14,
        data: [
          { name: '< 5mm/年', itemStyle: { color: '#34C759' } },
          { name: '5-15mm/年', itemStyle: { color: '#FFCC00' } },
          { name: '15-30mm/年', itemStyle: { color: '#FF9500' } },
          { name: '> 30mm/年', itemStyle: { color: '#FF3B30' } }
        ],
        title: {
          text: '沉降速率分级',
          left: 'center',
          top: -2,
          textStyle: { fontSize: 11, color: '#6B7280', fontWeight: 500, padding: [0, 0, 8, 0] }
        },
        padding: [28, 16, 12, 16]
      },
      grid: {
        left: '4%',
        right: '18%',
        top: '8%',
        bottom: '8%'
      },
      xAxis: {
        show: false,
        min: 118.55,
        max: 119.00
      },
      yAxis: {
        show: false,
        min: 31.80,
        max: 32.28
      },
      series: [
        {
          name: '热力梯度',
          type: 'effectScatter',
          coordinateSystem: 'cartesian2d',
          rippleEffect: {
            brushType: 'stroke',
            scale: 5,
            period: 5
          },
          data: heatData,
          symbolSize: 36,
          itemStyle: {
            color: (params: any) => {
              const rate = params.data[2]
              return getRateColor(rate)
            },
            opacity: 0.18
          },
          z: 0
        },
        {
          name: '沉降监测点',
          type: 'scatter',
          data: scatterData,
          symbolSize: (val: number[]) => {
            const cum = val[2]
            return Math.max(10, Math.min(28, 8 + cum / 12))
          },
          emphasis: {
            scale: 1.25,
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 3,
              shadowBlur: 22
            }
          },
          label: {
            show: true,
            formatter: (p: any) => p.data.value[3],
            position: 'top',
            fontSize: 10,
            color: '#475569',
            fontWeight: 500,
            distance: 6
          },
          z: 2
        }
      ]
    }
  }, [stationStats])

  const correlationOption = useMemo(() => {
    const xData = stationStats.map(s => s.avgWaterDepth)
    const yData = stationStats.map(s => s.annualSubsidenceRate)

    const { slope, intercept, r2, r } = linearRegression(xData, yData)

    const xMin = Math.min(...xData) - 2
    const xMax = Math.max(...xData) + 2
    const lineStart = { x: xMin, y: slope * xMin + intercept }
    const lineEnd = { x: xMax, y: slope * xMax + intercept }

    const scatterData = stationStats.map(s => ({
      name: s.stationName,
      value: [s.avgWaterDepth, s.annualSubsidenceRate, s.cumulativeSubsidence, s.stationName],
      itemStyle: {
        color: getRiskColor(s.riskLevel),
        shadowBlur: 8,
        shadowColor: getRiskColor(s.riskLevel),
        opacity: 0.88
      }
    }))

    const rLabel = Math.abs(r)
    const slopePer10m = Math.abs(slope * 10).toFixed(2)

    return {
      backgroundColor: '#FFFFFF',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: '#374151', fontSize: 12 },
        formatter: (params: any) => {
          if (params.seriesName === '回归线') {
            return `<div style="font-weight:600;">线性回归<br/>Y = ${slope.toFixed(3)}X + ${intercept.toFixed(2)}</div>`
          }
          const d = params.data.value
          return `
            <div style="font-weight:700;margin-bottom:8px;color:#111827;">${d[3]}</div>
            <div style="line-height:1.9;">
              <div>水位埋深: <b>${d[0].toFixed(2)} m</div>
              <div>年沉降量: <b style="color:${getRateColor(d[1])};">${d[1].toFixed(2)} mm</div>
              <div>累计沉降: <b>${d[2].toFixed(2)} mm</div>
            </div>
          `
        }
      },
      legend: {
        show: true,
        bottom: 0,
        left: 'center',
        textStyle: { color: '#6B7280', fontSize: 11 },
        itemGap: 16,
        data: [
          { name: '低风险', itemStyle: { color: '#34C759' } },
          { name: '中风险', itemStyle: { color: '#FFCC00' } },
          { name: '高风险', itemStyle: { color: '#FF9500' } },
          { name: '极高风险', itemStyle: { color: '#FF3B30' } },
          { name: '回归线', itemStyle: { color: '#EF4444', type: 'dashed' } }
        ]
      },
      grid: {
        left: '12%',
        right: '8%',
        top: '8%',
        bottom: '18%'
      },
      xAxis: {
        type: 'value',
        name: '平均水位埋深 (m)',
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: { color: '#64748B', fontSize: 12, fontWeight: 500 },
        axisLine: { show: true, lineStyle: { color: '#CBD5E1' } },
        axisTick: { show: false },
        axisLabel: { color: '#64748B', fontSize: 11 },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } }
      },
      yAxis: {
        type: 'value',
        name: '年沉降量 (mm/年)',
        nameLocation: 'middle',
        nameGap: 42,
        nameTextStyle: { color: '#64748B', fontSize: 12, fontWeight: 500 },
        axisLine: { show: true, lineStyle: { color: '#CBD5E1' } },
        axisTick: { show: false },
        axisLabel: { color: '#64748B', fontSize: 11 },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } }
      },
      graphic: [
        {
          type: 'group',
          right: 18,
          top: 16,
          children: [
            {
              type: 'rect',
              shape: { width: 150, height: 82 },
              style: {
                fill: '#F8FAFC',
                stroke: '#E2E8F0',
                lineWidth: 1
              }
            },
            {
              type: 'text',
              left: 12,
              top: 10,
              style: {
                text: '回归分析',
                fontSize: 12,
                fontWeight: 700,
                fill: '#1E293B'
              }
            },
            {
              type: 'text',
              left: 12,
              top: 32,
              style: {
                text: `相关系数 r = ${r.toFixed(3)}`,
                fontSize: 11,
                fill: rLabel > 0.7 ? '#DC2626' : '#475569',
                fontWeight: 600
              }
            },
            {
              type: 'text',
              left: 12,
              top: 52,
              style: {
                text: `R² = ${r2.toFixed(3)}`,
                fontSize: 11,
                fill: '#475569',
                fontWeight: 600
              }
            }
          ]
        },
        {
          type: 'group',
          left: 'center',
          bottom: 62,
          children: [
            {
              type: 'rect',
              shape: { width: 340, height: 30 },
              style: {
                fill: '#FEF3C7',
                stroke: '#FCD34D',
                lineWidth: 1,
                cornerRadius: [6, 6, 6, 6]
              }
            },
            {
              type: 'text',
              left: 14,
              top: 8,
              style: {
                text: `水位每增加10m埋深，沉降速率约增加 ${slopePer10m} mm/年`,
                fontSize: 12,
                fontWeight: 600,
                fill: '#92400E'
              }
            }
          ]
        }
      ],
      series: [
        {
          name: '监测点',
          type: 'scatter',
          data: scatterData,
          symbolSize: (val: number[]) => {
            const cum = val[2]
            return Math.max(12, Math.min(34, 12 + cum / 20))
          },
          emphasis: {
            scale: 1.3,
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 2,
              shadowBlur: 16
            }
          }
        },
        {
          name: '回归线',
          type: 'line',
          data: [
          [lineStart.x, lineStart.y],
          [lineEnd.x, lineEnd.y]
        ],
          lineStyle: {
            color: '#EF4444',
            type: 'dashed',
            width: 2.5
          },
          symbol: 'none',
          smooth: false,
          z: 3
        }
      ]
    }
  }, [stationStats])

  const couplingOption = useMemo(() => {
    const station = stationStatsMap.get(selectedStationId)
    if (!station) return {}

    const records = subsidenceRecords
      .filter(r => r.stationId === selectedStationId)
      .sort((a, b) => new Date(a.measureDate).getTime() - new Date(b.measureDate).getTime())

    const wellRecords = waterLevelRecords.filter(r => r.wellId === station.relatedWellId)

    const months: string[] = []
    const waterDepths: number[] = []
    const subsidences: number[] = []

    for (let i = 0; i < records.length; i++) {
      const rec = records[i]
      const date = new Date(rec.measureDate)
      const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      const monthWellRecs = wellRecords.filter(r => {
        const d = new Date(r.collectionTime)
        return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth()
      })
      const avgWater = monthWellRecs.length > 0
        ? monthWellRecs.reduce((acc, r) => acc + r.waterDepth, 0) / monthWellRecs.length
        : (wellRecords.length > 0 ? wellRecords[0].waterDepth : 20)

      months.push(ym)
      waterDepths.push(parseFloat(avgWater.toFixed(2)))

      if (i === 0) {
        subsidences.push(parseFloat(rec.cumulativeSubsidence.toFixed(2)))
      } else {
        const monthlySub = rec.cumulativeSubsidence - records[i - 1].cumulativeSubsidence
        subsidences.push(parseFloat(Math.max(0, monthlySub).toFixed(2)))
      }
    }

    const maxSub = Math.max(...subsidences)
    const threshold = maxSub * 0.7
    const highRiskIndices: number[] = []
    subsidences.forEach((v, i) => {
      if (v >= threshold) highRiskIndices.push(i)
    })

    let accelPoint = -1
    for (let i = 3; i < subsidences.length; i++) {
      const avgBefore = (subsidences[i - 1] + subsidences[i - 2] + subsidences[i - 3]) / 3
      if (subsidences[i] > avgBefore * 1.5) {
        accelPoint = i
        break
      }
    }

    const markAreas: any[] = []
    let startIdx = -1
    for (let i = 0; i < highRiskIndices.length; i++) {
      if (startIdx === -1) {
        startIdx = highRiskIndices[i]
      }
      if (i === highRiskIndices.length - 1 || highRiskIndices[i + 1] !== highRiskIndices[i] + 1) {
        markAreas.push([
          { xAxis: months[startIdx], itemStyle: { color: 'rgba(255, 207, 207, 0.25)' } },
          { xAxis: months[highRiskIndices[i]] }
        ])
        startIdx = -1
      } else if (highRiskIndices[i + 1] !== highRiskIndices[i] + 1) {
        markAreas.push([
          { xAxis: months[startIdx], itemStyle: { color: 'rgba(255, 207, 207, 0.25)' } },
          { xAxis: months[highRiskIndices[i]] }
        ])
        startIdx = -1
      }
    }

    return {
      backgroundColor: '#FFFFFF',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', crossStyle: { color: '#94A3B8' } },
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: '#374151', fontSize: 12 }
      },
      legend: {
        show: true,
        top: 0,
        left: 'center',
        textStyle: { color: '#6B7280', fontSize: 12 },
        itemGap: 24,
        data: [
          { name: '月均水位埋深' },
          { name: '月沉降量' }
        ]
      },
      grid: {
        left: '5%',
        right: '5%',
        top: '14%',
        bottom: '14%'
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          interval: 2,
          rotate: 35
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '水位埋深 (m)',
          nameTextStyle: { color: '#3B82F6', fontSize: 11, padding: [0, 0, 0, -20] },
          position: 'left',
          axisLine: { show: true, lineStyle: { color: '#3B82F6' } },
          axisLabel: { color: '#3B82F6', fontSize: 11 },
          splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } }
        },
        {
          type: 'value',
          name: '沉降量 (mm)',
          nameTextStyle: { color: '#EF4444', fontSize: 11, padding: [0, -20, 0, 0] },
          position: 'right',
          axisLine: { show: true, lineStyle: { color: '#EF4444' } },
          axisLabel: { color: '#EF4444', fontSize: 11 },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '月均水位埋深',
          type: 'bar',
          yAxisIndex: 0,
          data: waterDepths,
          barWidth: 14,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#60A5FA' },
              { offset: 1, color: '#93C5FD' }
            ])
          },
          markArea: markAreas.length > 0 ? {
            silent: true,
            data: markAreas
          } : undefined
        },
        {
          name: '月沉降量',
          type: 'line',
          yAxisIndex: 1,
          data: subsidences,
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: {
            color: '#EF4444',
            width: 2.5
          },
          itemStyle: {
            color: '#EF4444',
            borderColor: '#fff',
            borderWidth: 2
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(239, 68, 68, 0.25)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.02)' }
            ])
          },
          markLine: accelPoint >= 0 ? {
            symbol: ['none', 'arrow'],
            lineStyle: { color: '#B91C1C', type: 'dashed', width: 2 },
            label: {
              formatter: '沉降加速点',
              position: 'insideEndTop',
              color: '#B91C1C',
              fontSize: 11,
              fontWeight: 600
            },
            data: [
              { xAxis: months[accelPoint] }
            ]
          } : undefined
        }
      ]
    }
  }, [selectedStationId, stationStatsMap])

  const riskPieOption = useMemo(() => {
    const counts: Record<RiskLevel, number> = {
      '低风险': 0,
      '中风险': 0,
      '高风险': 0,
      '极高风险': 0
    }
    stationStats.forEach(s => counts[s.riskLevel]++)

    const data = [
      { name: '低风险', value: counts['低风险'], itemStyle: { color: '#34C759' } },
      { name: '中风险', value: counts['中风险'], itemStyle: { color: '#FFCC00' } },
      { name: '高风险', value: counts['高风险'], itemStyle: { color: '#FF9500' } },
      { name: '极高风险', value: counts['极高风险'], itemStyle: { color: '#FF3B30' } }
    ].filter(d => d.value > 0)

    const total = stationStats.length

    return {
      backgroundColor: '#FFFFFF',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => `${params.name}: ${params.value}个站点 (${params.percent}%)`
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: '#475569', fontSize: 12 },
        itemGap: 14
      },
      series: [
        {
          name: '风险等级',
          type: 'pie',
          radius: ['50%', '75%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 3
          },
          label: {
            show: true,
            formatter: '{b}\n{c}个',
            fontSize: 11,
            color: '#334155',
            fontWeight: 600,
            lineHeight: 16
          },
          labelLine: { length: 12, length2: 8 },
          data
        }
      ],
      graphic: [
        {
          type: 'text',
          left: '35%',
          top: '42%',
          style: {
            text: total.toString(),
            fontSize: 30,
            fontWeight: 700,
            fill: '#0F172A',
            textAlign: 'center'
          }
        },
        {
          type: 'text',
          left: '35%',
          top: '54%',
          style: {
            text: '监测站点',
            fontSize: 12,
            fill: '#64748B',
            textAlign: 'center'
          }
        }
      ]
    }
  }, [stationStats])

  const riskMatrixData = useMemo(() => {
    const populationDensity = ['高', '中', '低']
    return stationStats
      .filter(s => s.riskLevel !== '低风险')
      .map(s => ({
      ...s,
      density: populationDensity[stationStats.indexOf(s) % 3]
    }))
      .sort((a, b) => {
        const levelOrder: Record<RiskLevel, number> = { '极高风险': 0, '高风险': 1, '中风险': 2, '低风险': 3 }
        return levelOrder[a.riskLevel] - levelOrder[b.riskLevel]
      })
      .slice(0, 6)
  }, [stationStats])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Target className="w-8 h-8 text-danger" />
          地面沉降监测分析
        </h1>
        <p className="text-gray-500 text-base ml-11">沉降关联、沉降分布、耦合曲线、风险评估一体化分析平台
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        <StatCard
          title="累计沉降最大点"
          value={maxCumulativeStation
            ? `${maxCumulativeStation.cumulativeSubsidence.toFixed(1)}`
            : '0'}
          unit="mm"
          icon={AlertTriangle}
          color="danger"
          trend={8.5}
        />
        <StatCard
          title="年平均沉降速率"
          value={avgAnnualRate}
          unit="mm/年"
          icon={TrendingDown}
          color="warning"
          trend={5.2}
        />
        <StatCard
          title="沉降监测点数"
          value={subsidenceStations.length}
          icon={MapPin}
          color="primary"
        />
        <StatCard
          title="高风险区数量"
          value={highRiskCount}
          unit="个"
          icon={ShieldAlert}
          color="danger"
        />
        <StatCard
          title="累计沉降面积"
          value={estimatedArea}
          unit="km²"
          icon={Layers}
          color="secondary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">地面沉降监测点分布与速率热力</h2>
                <p className="text-xs text-gray-400 mt-0.5">颜色分级: 年沉降速率 (mm/年) 累计沉降决定散点大小</p>
              </div>
            </div>
          </div>
          <div className="p-3">
            <ReactECharts
              option={gisOption}
              style={{ height: '500px', width: '100%' }}
              notMerge
              lazyUpdate
            />
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">水位降深-沉降量关联分析</h2>
                <p className="text-xs text-gray-400 mt-0.5">气泡大小=累计沉降 | 颜色=风险等级</p>
              </div>
            </div>
          </div>
          <div className="p-3">
            <ReactECharts
              option={correlationOption}
              style={{ height: '500px', width: '100%' }}
              notMerge
              lazyUpdate
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">典型监测点水位-沉降耦合时序</h2>
              <p className="text-xs text-gray-400 mt-0.5">36个月水位-沉降量双轴时序曲线</p>
            </div>
          </div>
          <div className="relative">
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer"
            >
              {stationStats.map(s => (
                <option key={s.stationId} value={s.stationId}>
                  {s.stationName}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="p-4">
          <ReactECharts
            option={couplingOption}
            style={{ height: '360px', width: '100%' }}
            notMerge
            lazyUpdate
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-gray-100">
            <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 text-white">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">沉降风险等级分区</h2>
              <p className="text-xs text-gray-400 mt-0.5">按监测站点统计分布</p>
            </div>
          </div>
          <div className="p-4">
            <ReactECharts
              option={riskPieOption}
              style={{ height: '280px', width: '100%' }}
              notMerge
            />
          </div>

          <div className="px-5 pb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              风险矩阵（沉降速率 × 人口密度）
            </h3>
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">监测点</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">沉降速率</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">人口密度</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">风险等级</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {riskMatrixData.map((item, idx) => (
                    <tr key={item.stationId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                      <td className="px-4 py-3 font-medium text-gray-800 text-xs truncate max-w-[140px]" title={item.stationName}>
                        {item.stationName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold" style={{ color: getRateColor(item.annualSubsidenceRate) }}>
                          {item.annualSubsidenceRate.toFixed(2)} mm/年
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cnDensityBadge(item.density)}>
                          {item.density}密度
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${getRiskColor(item.riskLevel)}22`,
                            color: getRiskColor(item.riskLevel)
                          }}
                        >
                          {item.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-gray-100">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
              <Siren className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">沉降预警阈值配置</h2>
              <p className="text-xs text-gray-400 mt-0.5">四级预警阈值及处置建议</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="relative overflow-hidden rounded-xl p-5 glow-blue">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 pointer-events-none" />
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                  <Droplets className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-blue-700">蓝色预警</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      10 mm/年
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    沉降速率范围: 10 ~ 20 mm/年
                  </p>
                  <p className="text-xs font-semibold text-gray-700 mb-2">触发响应：
                    <span className="font-normal text-gray-600 ml-1">24小时内现场核查，加密监测频次至每日1次</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['加强水位复核', '周边巡查', '数据趋势分析', '预警通知相关单位'].map(t => (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100">
                        <CheckCircle2 className="w-3 h-3" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0" />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl p-5 glow-yellow">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-amber-400/10 pointer-events-none" />
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white shadow-lg">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-amber-700">黄色预警</span>
                    <span className="px-2 py-0.5 bg-yellow-100 text-amber-800 text-xs font-semibold rounded-full">
                      20 mm/年
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    沉降速率范围: 20 ~ 35 mm/年
                  </p>
                  <p className="text-xs font-semibold text-gray-700 mb-2">触发响应：
                    <span className="font-normal text-gray-600 ml-1">12小时内现场核查，启动应急预案，加密监测至每6小时1次</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['专家会商', '建筑物排查', '地下水补给评估', '限制地下水开采', '周边工程影响分析'].map(t => (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-amber-800 text-xs rounded-md border border-yellow-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-500 flex-shrink-0" />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl p-5 glow-orange">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-red-400/10 pointer-events-none" />
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg">
                  <Zap className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-orange-700">橙色预警</span>
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                      35 mm/年
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    沉降速率范围: 35 ~ 50 mm/年
                  </p>
                  <p className="text-xs font-semibold text-gray-700 mb-2">触发响应：
                    <span className="font-normal text-gray-600 ml-1">6小时内现场核查，启动二级应急响应，实时监测</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['应急专家组进驻', '实施人工回灌', '暂停地下水开采管制', '建筑物加固评估', '居民疏散预案'].map(t => (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-md border border-orange-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-orange-500 flex-shrink-0" />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl p-5 glow-red">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-rose-500/10 pointer-events-none" />
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                  <Siren className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-red-700">红色预警</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full animate-pulse">
                      50 mm/年
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    沉降速率范围: {'>'} 50 mm/年
                  </p>
                  <p className="text-xs font-semibold text-gray-700 mb-2">触发响应：
                    <span className="font-normal text-gray-600 ml-1">立即启动一级应急响应，全员待命，24小时实时监测</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['市政府应急指挥部', '全面停采地下水', '强制回灌措施', '人员撤离转移', '建筑物紧急加固'].map(t => (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-red-500 flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function cnDensityBadge(density: string) {
  if (density === '高') return 'inline-flex px-2 py-0.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-md border border-rose-200'
  if (density === '中') return 'inline-flex px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-md border border-amber-200'
  return 'inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-200'
}
