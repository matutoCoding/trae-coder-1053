import React, { useEffect, useMemo, useState } from 'react'
import { Activity, Droplets, AlertTriangle, TrendingUp, TrendingDown, ChevronDown, Calendar, BarChart3, Layers, AlertCircle, Info, ArrowDown, ArrowUp } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
  MarkAreaComponent,
  DataZoomComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { monitoringWells } from '@/data/wells'
import { waterLevelRecords } from '@/data/waterLevel'
import StatCard from '@/components/StatCard'
import { cn } from '@/lib/utils'

echarts.use([
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
  MarkAreaComponent,
  DataZoomComponent,
  CanvasRenderer
])

const TIME_GRANULARITIES = [
  { key: 'day', label: '日' },
  { key: 'week', label: '周' },
  { key: 'month', label: '月' },
  { key: 'quarter', label: '季' },
  { key: 'year', label: '年' }
] as const

type TimeGranularity = typeof TIME_GRANULARITIES[number]['key']

const WELL_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16'
]

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr.split(' ')[0])
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export default function DrawdownTrend() {
  const [granularity, setGranularity] = useState<TimeGranularity>('day')
  const [selectedWellId, setSelectedWellId] = useState<string>('all')
  const [selectedCompareWells, setSelectedCompareWells] = useState<string[]>(
    monitoringWells.slice(0, 5).map(w => w.wellId)
  )

  useEffect(() => {
    if (selectedWellId !== 'all') {
      setSelectedCompareWells([selectedWellId])
    }
  }, [selectedWellId])

  const allRecordsByDate = useMemo(() => {
    const map = new Map<string, { wellDepths: Map<string, number[]> }>()
    waterLevelRecords.forEach(record => {
      const date = record.collectionTime.split(' ')[0]
      if (!map.has(date)) {
        map.set(date, { wellDepths: new Map() })
      }
      const dayData = map.get(date)!
      if (!dayData.wellDepths.has(record.wellId)) {
        dayData.wellDepths.set(record.wellId, [])
      }
      dayData.wellDepths.get(record.wellId)!.push(record.waterDepth)
    })
    return map
  }, [])

  const sortedDates = useMemo(() => {
    return Array.from(allRecordsByDate.keys()).sort((a, b) => a.localeCompare(b))
  }, [allRecordsByDate])

  const latestDate = useMemo(() => {
    return sortedDates[sortedDates.length - 1]
  }, [sortedDates])

  const cityDailyAvg = useMemo(() => {
    const result: Array<{ date: string; avgDepth: number }> = []
    sortedDates.forEach(date => {
      const dayData = allRecordsByDate.get(date)
      if (dayData) {
        let sum = 0
        let count = 0
        dayData.wellDepths.forEach(depths => {
          depths.forEach(d => {
            sum += d
            count++
          })
        })
        if (count > 0) {
          result.push({ date, avgDepth: sum / count })
        }
      }
    })
    return result
  }, [sortedDates, allRecordsByDate])

  const currentDailyAvg = useMemo(() => {
    if (selectedWellId === 'all') {
      return cityDailyAvg
    }
    const result: Array<{ date: string; avgDepth: number }> = []
    sortedDates.forEach(date => {
      const dayData = allRecordsByDate.get(date)
      if (dayData) {
        const depths = dayData.wellDepths.get(selectedWellId)
        if (depths && depths.length > 0) {
          const sum = depths.reduce((s, d) => s + d, 0)
          result.push({ date, avgDepth: sum / depths.length })
        }
      }
    })
    return result
  }, [selectedWellId, cityDailyAvg, sortedDates, allRecordsByDate])

  const last365DaysAvg = useMemo(() => {
    const startIdx = Math.max(0, currentDailyAvg.length - 365)
    return currentDailyAvg.slice(startIdx)
  }, [currentDailyAvg])

  const getLast30DaysMean = (data: typeof cityDailyAvg) => {
    const last30 = data.slice(-30)
    if (last30.length === 0) return 0
    return last30.reduce((sum, d) => sum + d.avgDepth, 0) / last30.length
  }

  const getPrev30DaysMean = (data: typeof cityDailyAvg) => {
    const endIdx = Math.max(0, data.length - 30)
    const startIdx = Math.max(0, endIdx - 30)
    const prev30 = data.slice(startIdx, endIdx)
    if (prev30.length === 0) return 0
    return prev30.reduce((sum, d) => sum + d.avgDepth, 0) / prev30.length
  }

  const getSameDayLastYear = (data: typeof cityDailyAvg, dateStr: string) => {
    const targetDate = parseDate(dateStr)
    const lastYearDate = addDays(targetDate, -365)
    const lastYearStr = formatDate(lastYearDate)
    const found = data.find(d => d.date === lastYearStr)
    return found?.avgDepth ?? null
  }

  const last30Mean = useMemo(() => getLast30DaysMean(currentDailyAvg), [currentDailyAvg])
  const prev30Mean = useMemo(() => getPrev30DaysMean(currentDailyAvg), [currentDailyAvg])
  const monthChange = useMemo(() => last30Mean - prev30Mean, [last30Mean, prev30Mean])
  const monthChangePercent = useMemo(() => prev30Mean !== 0 ? (monthChange / prev30Mean) * 100 : 0, [monthChange, prev30Mean])

  const sameDayLastYearValue = useMemo(() => getSameDayLastYear(currentDailyAvg, latestDate), [currentDailyAvg, latestDate])
  const yearChange = useMemo(() => sameDayLastYearValue !== null ? last30Mean - sameDayLastYearValue : 0, [last30Mean, sameDayLastYearValue])
  const yearChangePercent = useMemo(() => sameDayLastYearValue !== null && sameDayLastYearValue !== 0 ? (yearChange / sameDayLastYearValue) * 100 : 0, [yearChange, sameDayLastYearValue])

  const wellLatestDepth = useMemo(() => {
    const map = new Map<string, { depth: number; date: string; well: typeof monitoringWells[0] }>()
    monitoringWells.forEach(well => {
      const wellRecords = waterLevelRecords.filter(r => r.wellId === well.wellId)
      if (wellRecords.length > 0) {
        const sorted = wellRecords.sort((a, b) => b.collectionTime.localeCompare(a.collectionTime))
        map.set(well.wellId, {
          depth: sorted[0].waterDepth,
          date: sorted[0].collectionTime.split(' ')[0],
          well
        })
      }
    })
    return map
  }, [])

  const maxDrawdownWell = useMemo(() => {
    if (selectedWellId !== 'all') {
      const info = wellLatestDepth.get(selectedWellId)
      if (info) {
        return { wellName: info.well.wellName, depth: info.depth, wellId: selectedWellId }
      }
      return null
    }
    let maxWell: { wellName: string; depth: number; wellId: string } | null = null
    wellLatestDepth.forEach((info, wellId) => {
      if (!maxWell || info.depth > maxWell.depth) {
        maxWell = { wellName: info.well.wellName, depth: info.depth, wellId }
      }
    })
    return maxWell
  }, [selectedWellId, wellLatestDepth])

  const recoveryWellCount = useMemo(() => {
    if (selectedWellId !== 'all') {
      const wellRecords = waterLevelRecords
        .filter(r => r.wellId === selectedWellId)
        .sort((a, b) => a.collectionTime.localeCompare(b.collectionTime))
      if (wellRecords.length >= 30) {
        const last30 = wellRecords.slice(-30)
        const firstHalf = last30.slice(0, 15).reduce((s, r) => s + r.waterDepth, 0) / 15
        const secondHalf = last30.slice(15).reduce((s, r) => s + r.waterDepth, 0) / 15
        if (secondHalf < firstHalf) return 1
      }
      return 0
    }
    let count = 0
    wellLatestDepth.forEach((_, wellId) => {
      const wellRecords = waterLevelRecords
        .filter(r => r.wellId === wellId)
        .sort((a, b) => a.collectionTime.localeCompare(b.collectionTime))
      if (wellRecords.length >= 30) {
        const last30 = wellRecords.slice(-30)
        const firstHalf = last30.slice(0, 15).reduce((s, r) => s + r.waterDepth, 0) / 15
        const secondHalf = last30.slice(15).reduce((s, r) => s + r.waterDepth, 0) / 15
        if (secondHalf < firstHalf) count++
      }
    })
    return count
  }, [selectedWellId, wellLatestDepth])

  const aggregateByGranularity = useMemo(() => {
    return (data: typeof last365DaysAvg, gran: TimeGranularity) => {
      if (gran === 'day') return data.map(d => ({ date: d.date, value: d.avgDepth }))

      const groups = new Map<string, number[]>()
      data.forEach(item => {
        const date = parseDate(item.date)
        let key: string
        if (gran === 'week') {
          const year = date.getFullYear()
          const onejan = new Date(year, 0, 1)
          const week = Math.ceil((((date.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7)
          key = `${year}-W${String(week).padStart(2, '0')}`
        } else if (gran === 'month') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        } else if (gran === 'quarter') {
          const year = date.getFullYear()
          const quarter = Math.floor(date.getMonth() / 3) + 1
          key = `${year}-Q${quarter}`
        } else {
          key = `${date.getFullYear()}`
        }
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(item.avgDepth)
      })

      return Array.from(groups.entries()).map(([date, values]) => ({
        date,
        value: values.reduce((s, v) => s + v, 0) / values.length
      }))
    }
  }, [])

  const trendChartOption = useMemo(() => {
    const aggregated = aggregateByGranularity(last365DaysAvg, granularity)
    const dates = aggregated.map(d => d.date)
    const depths = aggregated.map(d => parseFloat(d.value.toFixed(2)))

    const baseline = depths[0] ?? 0
    const cumulative = depths.map(d => parseFloat((d - baseline).toFixed(2)))

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: '#374151', fontSize: 12 },
        axisPointer: { type: 'cross', crossStyle: { color: '#9CA3AF' } },
        formatter: (params: any) => {
          if (!params || params.length === 0) return ''
          const date = params[0].axisValue
          let html = `<div style="font-weight:600;margin-bottom:8px;color:#111827;">${date}</div>`
          params.forEach((p: any) => {
            const color = p.color
            const marker = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;"></span>`
            const unit = p.seriesName.includes('累计') ? 'm' : 'm'
            const sign = p.seriesName.includes('累计') && p.value > 0 ? '+' : ''
            html += `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;min-width:220px;">
              <span>${marker}${p.seriesName}</span>
              <span style="font-weight:600;font-family:monospace;">${sign}${p.value} ${unit}</span>
            </div>`
          })
          return html
        }
      },
      legend: {
        show: true,
        top: 0,
        right: 20,
        textStyle: { color: '#6B7280', fontSize: 12 },
        itemGap: 20,
        icon: 'roundRect'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '15%',
        containLabel: true
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          type: 'slider',
          height: 24,
          bottom: 8,
          borderColor: 'transparent',
          backgroundColor: '#F3F4F6',
          fillerColor: 'rgba(0, 184, 217, 0.15)',
          handleStyle: {
            color: '#00B8D9',
            borderColor: '#fff',
            borderWidth: 2
          },
          textStyle: { color: '#9CA3AF', fontSize: 10 }
        }
      ],
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#6B7280',
          fontSize: 11,
          rotate: dates.length > 30 ? 45 : 0,
          interval: Math.floor(dates.length / 12)
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '水位埋深(m)',
          nameTextStyle: { color: '#6B7280', fontSize: 11, padding: [0, 0, 0, 40] },
          position: 'left',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#6B7280', fontSize: 11, formatter: '{value}' },
          splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } }
        },
        {
          type: 'value',
          name: '累计降深(m)',
          nameTextStyle: { color: '#EF4444', fontSize: 11, padding: [0, 40, 0, 0] },
          position: 'right',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#EF4444', fontSize: 11, formatter: (v: number) => (v > 0 ? '+' : '') + v },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '水位埋深',
          type: 'line',
          yAxisIndex: 0,
          data: depths,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 2.5, color: '#00B8D9' },
          itemStyle: { color: '#00B8D9', borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 184, 217, 0.35)' },
              { offset: 0.5, color: 'rgba(0, 184, 217, 0.12)' },
              { offset: 1, color: 'rgba(0, 184, 217, 0.02)' }
            ])
          },
          markLine: {
            silent: false,
            symbol: 'none',
            lineStyle: { type: 'dashed' },
            label: { formatter: '{b}\n{c}m', fontSize: 10 },
            data: [
              { yAxis: 30, name: '黄色预警', lineStyle: { color: '#FF9500', width: 1.5 }, label: { color: '#FF9500' } },
              { yAxis: 40, name: '红色预警', lineStyle: { color: '#EF4444', width: 1.5 }, label: { color: '#EF4444' } }
            ]
          },
          emphasis: { focus: 'series' }
        },
        {
          name: '累计降深',
          type: 'line',
          yAxisIndex: 1,
          data: cumulative,
          smooth: true,
          symbol: 'diamond',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 2, color: '#EF4444', type: 'solid' },
          itemStyle: { color: '#EF4444', borderColor: '#fff', borderWidth: 2 },
          emphasis: { focus: 'series' }
        }
      ]
    }
  }, [last365DaysAvg, granularity, aggregateByGranularity])

  const last90DaysRecordsByWell = useMemo(() => {
    const startIdx = Math.max(0, sortedDates.length - 90)
    const last90Dates = sortedDates.slice(startIdx)
    const result = new Map<string, Array<{ date: string; depth: number }>>()

    selectedCompareWells.forEach(wellId => {
      result.set(wellId, [])
    })

    last90Dates.forEach(date => {
      const dayData = allRecordsByDate.get(date)
      if (dayData) {
        selectedCompareWells.forEach(wellId => {
          const depths = dayData.wellDepths.get(wellId)
          if (depths && depths.length > 0) {
            const avg = depths.reduce((s, d) => s + d, 0) / depths.length
            result.get(wellId)!.push({ date, depth: parseFloat(avg.toFixed(2)) })
          }
        })
      }
    })

    return result
  }, [sortedDates, allRecordsByDate, selectedCompareWells])

  const toggleCompareWell = (wellId: string) => {
    setSelectedCompareWells(prev => {
      if (prev.includes(wellId)) {
        if (prev.length <= 1) return prev
        return prev.filter(id => id !== wellId)
      }
      if (prev.length >= 8) return prev
      return [...prev, wellId]
    })
  }

  const compareChartOption = useMemo(() => {
    const commonDates = sortedDates.slice(Math.max(0, sortedDates.length - 90))

    const series = selectedCompareWells.map((wellId, idx) => {
      const well = monitoringWells.find(w => w.wellId === wellId)
      const data = last90DaysRecordsByWell.get(wellId) || []
      const dataMap = new Map(data.map(d => [d.date, d.depth]))
      const values = commonDates.map(date => {
        const v = dataMap.get(date)
        return v !== undefined ? v : null
      })
      const color = WELL_COLORS[idx % WELL_COLORS.length]

      return {
        name: well?.wellName || wellId,
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        showSymbol: false,
        connectNulls: true,
        lineStyle: { width: 2, color },
        itemStyle: { color, borderColor: '#fff', borderWidth: 2 },
        emphasis: {
          focus: 'series',
          itemStyle: { shadowBlur: 10, shadowColor: color }
        }
      }
    })

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: '#374151', fontSize: 12 },
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.04)' } },
        formatter: (params: any) => {
          if (!params || params.length === 0) return ''
          const date = params[0].axisValue
          let html = `<div style="font-weight:600;margin-bottom:8px;color:#111827;">${date}</div>`
          params.forEach((p: any) => {
            if (p.value === null || p.value === undefined || isNaN(p.value)) return
            const color = p.color
            const marker = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;"></span>`
            const firstVal = last90DaysRecordsByWell.get(selectedCompareWells[params.indexOf(p)])?.[0]?.depth ?? p.value
            const diff = parseFloat((p.value - firstVal).toFixed(2))
            const diffSign = diff > 0 ? '+' : ''
            const diffColor = diff > 0 ? '#EF4444' : diff < 0 ? '#10B981' : '#6B7280'
            html += `<div style="margin:5px 0;">
              <div style="display:flex;justify-content:space-between;align-items:center;min-width:260px;">
                <span style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;vertical-align:middle;">${marker}${p.seriesName}</span>
                <span style="font-weight:600;font-family:monospace;">${p.value} m</span>
              </div>
              <div style="font-size:11px;color:${diffColor};padding-left:16px;">降深幅度: ${diffSign}${diff} m</div>
            </div>`
          })
          return html
        }
      },
      legend: {
        show: true,
        top: 0,
        left: 'center',
        textStyle: { color: '#6B7280', fontSize: 11 },
        itemGap: 12,
        icon: 'roundRect'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: commonDates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#6B7280',
          fontSize: 11,
          rotate: 30,
          interval: Math.floor(commonDates.length / 10)
        }
      },
      yAxis: {
        type: 'value',
        name: '水位埋深(m)',
        nameTextStyle: { color: '#6B7280', fontSize: 11, padding: [0, 0, 0, 40] },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#6B7280', fontSize: 11 },
        splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } }
      },
      series
    }
  }, [selectedCompareWells, last90DaysRecordsByWell, sortedDates])

  const compareTableData = useMemo(() => {
    return selectedCompareWells.map(wellId => {
      const well = monitoringWells.find(w => w.wellId === wellId)
      const records = last90DaysRecordsByWell.get(wellId) || []
      const current = records.length > 0 ? records[records.length - 1].depth : 0
      const monthlyAvg = records.length >= 30
        ? records.slice(-30).reduce((s, r) => s + r.depth, 0) / 30
        : records.reduce((s, r) => s + r.depth, 0) / Math.max(1, records.length)
      const quarterlyAvg = records.reduce((s, r) => s + r.depth, 0) / Math.max(1, records.length)
      const first = records.length > 0 ? records[0].depth : current
      const seasonalChange = quarterlyAvg - first
      const yearlyChange = well ? current - well.baselineWaterLevel : 0
      let status = '正常'
      let statusColor = 'text-success bg-success/10 border-success/20'
      if (current >= 40) {
        status = '红色预警'
        statusColor = 'text-danger bg-danger/10 border-danger/20'
      } else if (current >= 30) {
        status = '黄色预警'
        statusColor = 'text-warning bg-warning/10 border-warning/20'
      } else if (yearlyChange > 3) {
        status = '下降较快'
        statusColor = 'text-warning bg-warning/10 border-warning/20'
      }
      return {
        wellId,
        wellName: well?.wellName || wellId,
        current: parseFloat(current.toFixed(2)),
        monthlyAvg: parseFloat(monthlyAvg.toFixed(2)),
        quarterlyChange: parseFloat(seasonalChange.toFixed(2)),
        yearlyChange: parseFloat(yearlyChange.toFixed(2)),
        status,
        statusColor
      }
    })
  }, [selectedCompareWells, last90DaysRecordsByWell])

  const seasonalData = useMemo(() => {
    const years = ['2023', '2024', '2025']
    const monthlyByYear: Record<string, Map<string, number[]>> = {}
    years.forEach(y => { monthlyByYear[y] = new Map() })

    currentDailyAvg.forEach(item => {
      const date = parseDate(item.date)
      const year = String(date.getFullYear())
      if (!years.includes(year)) return
      const monthKey = String(date.getMonth() + 1).padStart(2, '0')
      if (!monthlyByYear[year].has(monthKey)) {
        monthlyByYear[year].set(monthKey, [])
      }
      monthlyByYear[year].get(monthKey)!.push(item.avgDepth)
    })

    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    const result = years.map(year => ({
      year,
      values: months.map(m => {
        const vals = monthlyByYear[year].get(m)
        if (!vals || vals.length === 0) return null
        return parseFloat((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2))
      })
    }))

    const dryMonths = [0, 1, 2, 3, 4]
    const wetMonths = [5, 6, 7, 8]

    let drySum = 0, dryCount = 0, wetSum = 0, wetCount = 0
    result.forEach(r => {
      r.values.forEach((v, i) => {
        if (v === null) return
        if (dryMonths.includes(i)) { drySum += v; dryCount++ }
        if (wetMonths.includes(i)) { wetSum += v; wetCount++ }
      })
    })
    const dryAvg = dryCount > 0 ? drySum / dryCount : 0
    const wetAvg = wetCount > 0 ? wetSum / wetCount : 0
    const diff = dryAvg - wetAvg

    return {
      months: months.map(m => `${parseInt(m)}月`),
      series: result,
      dryAvg: parseFloat(dryAvg.toFixed(2)),
      wetAvg: parseFloat(wetAvg.toFixed(2)),
      diff: parseFloat(diff.toFixed(2))
    }
  }, [currentDailyAvg])

  const seasonalChartOption = useMemo(() => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B']
    const yearColors: Record<string, string> = {}
    seasonalData.series.forEach((s, i) => { yearColors[s.year] = colors[i] })

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: '#374151', fontSize: 12 },
        formatter: (params: any) => {
          if (!params || params.length === 0) return ''
          let html = `<div style="font-weight:600;margin-bottom:8px;color:#111827;">${params[0].axisValue}</div>`
          params.forEach((p: any) => {
            if (p.value === null || p.value === undefined || isNaN(p.value)) return
            const marker = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>`
            html += `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;min-width:200px;">
              <span>${marker}${p.seriesName}年</span>
              <span style="font-weight:600;font-family:monospace;">${p.value} m</span>
            </div>`
          })
          return html
        }
      },
      legend: {
        show: true,
        top: 0,
        right: 10,
        textStyle: { color: '#6B7280', fontSize: 12 },
        itemGap: 16,
        formatter: (name: string) => `${name}年`,
        icon: 'roundRect'
      },
      grid: {
        left: '4%',
        right: '5%',
        bottom: '10%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: seasonalData.months,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { show: false },
        axisLabel: { color: '#6B7280', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        name: '水位埋深(m)',
        nameTextStyle: { color: '#6B7280', fontSize: 11, padding: [0, 0, 0, 40] },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#6B7280', fontSize: 11 },
        splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } }
      },
      series: [
        {
          name: 'markArea_dry',
          type: 'line',
          data: [],
          markArea: {
            silent: true,
            itemStyle: { color: 'rgba(255, 149, 0, 0.06)' },
            label: {
              show: true,
              position: 'insideTop',
              color: '#FF9500',
              fontSize: 10,
              fontWeight: 500,
              formatter: '枯水期 (1-5月)'
            },
            data: [[{ xAxis: '1月' }, { xAxis: '5月' }]]
          }
        },
        {
          name: 'markArea_wet',
          type: 'line',
          data: [],
          markArea: {
            silent: true,
            itemStyle: { color: 'rgba(16, 185, 129, 0.06)' },
            label: {
              show: true,
              position: 'insideTop',
              color: '#10B981',
              fontSize: 10,
              fontWeight: 500,
              formatter: '丰水期 (6-9月)'
            },
            data: [[{ xAxis: '6月' }, { xAxis: '9月' }]]
          }
        },
        ...seasonalData.series.map(s => ({
          name: s.year,
          type: 'line',
          data: s.values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { width: 2.5, color: yearColors[s.year] },
          itemStyle: { color: yearColors[s.year], borderColor: '#fff', borderWidth: 2 },
          emphasis: {
            focus: 'series',
            itemStyle: { shadowBlur: 8, shadowColor: yearColors[s.year] }
          },
          connectNulls: true
        }))
      ]
    }
  }, [seasonalData])

  const yearlyTrendData = useMemo(() => {
    const yearly: Record<number, number[]> = {}

    currentDailyAvg.forEach(item => {
      const year = parseDate(item.date).getFullYear()
      if (!yearly[year]) yearly[year] = []
      yearly[year].push(item.avgDepth)
    })

    const actualYears: number[] = []
    const actualValues: number[] = []
    Object.keys(yearly).sort().forEach(yStr => {
      const year = parseInt(yStr)
      const vals = yearly[year]
      if (vals.length >= 180) {
        actualYears.push(year)
        actualValues.push(parseFloat((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)))
      }
    })

    const last5Years = actualYears.slice(-5)
    const last5Values = actualValues.slice(-5)

    const trendLine = last5Values.map((v, i) => {
      const xMean = (last5Values.length - 1) / 2
      const yMean = last5Values.reduce((s, v) => s + v, 0) / last5Values.length
      let numerator = 0, denominator = 0
      last5Values.forEach((vy, ix) => {
        numerator += (ix - xMean) * (vy - yMean)
        denominator += (ix - xMean) ** 2
      })
      const slope = denominator !== 0 ? numerator / denominator : 0
      const intercept = yMean - slope * xMean
      return parseFloat((slope * i + intercept).toFixed(2))
    })

    const slope = last5Values.length >= 2
      ? (last5Values[last5Values.length - 1] - last5Values[0]) / (last5Values.length - 1)
      : 1.2

    const lastYear = last5Years[last5Years.length - 1]
    const lastValue = last5Values[last5Values.length - 1]
    const predictYears = [lastYear + 1, lastYear + 2, lastYear + 3]
    const predictValues = predictYears.map((_, i) =>
      parseFloat((lastValue + slope * (i + 1)).toFixed(2))
    )

    let willBreak = false
    let breakYear = 0
    let currentVal = lastValue
    for (let i = 1; i <= 10; i++) {
      currentVal += slope
      if (currentVal >= 45) {
        willBreak = true
        breakYear = lastYear + i
        break
      }
    }

    return {
      actualYears: last5Years.map(String),
      actualValues: last5Values,
      trendYears: last5Years.map(String),
      trendValues: trendLine,
      predictYears: predictYears.map(String),
      predictValues,
      slope: parseFloat(slope.toFixed(2)),
      willBreak,
      breakYear
    }
  }, [currentDailyAvg])

  const yearlyTrendOption = useMemo(() => {
    const allYears = [...yearlyTrendData.actualYears, ...yearlyTrendData.predictYears]

    const barData = yearlyTrendData.actualValues.map(v => ({
      value: v,
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#00B8D9' },
          { offset: 1, color: 'rgba(0, 184, 217, 0.3)' }
        ])
      }
    }))

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: '#374151', fontSize: 12 },
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.04)' } },
        formatter: (params: any) => {
          if (!params || params.length === 0) return ''
          let html = `<div style="font-weight:600;margin-bottom:8px;color:#111827;">${params[0].axisValue}年</div>`
          params.forEach((p: any) => {
            if (p.value === null || p.value === undefined || isNaN(p.value)) return
            const marker = `<span style="display:inline-block;width:10px;height:10px;border-radius:${p.seriesName.includes('柱') ? '2px' : '50%'};background:${p.color};margin-right:6px;"></span>`
            html += `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;min-width:200px;">
              <span>${marker}${p.seriesName}</span>
              <span style="font-weight:600;font-family:monospace;">${p.value} m</span>
            </div>`
          })
          return html
        }
      },
      legend: {
        show: true,
        top: 0,
        right: 10,
        textStyle: { color: '#6B7280', fontSize: 12 },
        itemGap: 16,
        icon: 'roundRect'
      },
      grid: {
        left: '4%',
        right: '5%',
        bottom: '10%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: allYears,
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#6B7280',
          fontSize: 12,
          formatter: (v: string) => `${v}年`
        }
      },
      yAxis: {
        type: 'value',
        name: '年均水位(m)',
        nameTextStyle: { color: '#6B7280', fontSize: 11, padding: [0, 0, 0, 40] },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#6B7280', fontSize: 11 },
        splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
        min: (value: any) => Math.floor(value.min - 2)
      },
      series: [
        {
          name: '年均水位',
          type: 'bar',
          barWidth: '36%',
          data: [...barData, ...yearlyTrendData.predictYears.map(() => null)]
        },
        {
          name: '趋势线',
          type: 'line',
          data: [...yearlyTrendData.trendValues, ...yearlyTrendData.predictYears.map(() => null)],
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#F59E0B', type: 'solid' },
          z: 3
        },
        {
          name: '预测值',
          type: 'line',
          data: [...yearlyTrendData.actualYears.map(() => null), yearlyTrendData.actualValues[yearlyTrendData.actualValues.length - 1], ...yearlyTrendData.predictValues],
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 2.5, color: '#9CA3AF', type: 'dashed' },
          itemStyle: { color: '#9CA3AF', borderColor: '#fff', borderWidth: 2 },
          z: 4,
          connectNulls: true,
          markLine: {
            silent: false,
            symbol: 'none',
            lineStyle: { type: 'solid', color: '#EF4444', width: 2 },
            label: {
              formatter: '控制红线 45m',
              fontSize: 11,
              color: '#EF4444',
              fontWeight: 600,
              position: 'insideEndTop'
            },
            data: [{ yAxis: 45 }]
          }
        }
      ]
    }
  }, [yearlyTrendData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-secondary" />
          降深趋势分析
        </h1>
        <p className="text-gray-500 text-base ml-11">地下水位埋深趋势、多井点对比、季节性与年度变化</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
        <StatCard
          title={selectedWellId === 'all' ? '全市平均埋深' : (maxDrawdownWell ? `${maxDrawdownWell.wellName}埋深` : '当前井埋深')}
          value={last30Mean.toFixed(2)}
          unit="m"
          icon={Droplets}
          color="primary"
        />

        <StatCard
          title="较上月变化"
          value={(monthChange > 0 ? '+' : '') + monthChange.toFixed(2)}
          unit="m"
          icon={monthChange > 0 ? ArrowUp : ArrowDown}
          trend={parseFloat(monthChangePercent.toFixed(1))}
          color={monthChange > 0 ? 'danger' : 'success'}
        />

        <StatCard
          title="较去年同期"
          value={sameDayLastYearValue !== null ? (yearChange > 0 ? '+' : '') + yearChange.toFixed(2) : '--'}
          unit="m"
          icon={Calendar}
          trend={sameDayLastYearValue !== null ? parseFloat(yearChangePercent.toFixed(1)) : undefined}
          color={yearChange > 0 ? 'danger' : 'success'}
        />

        <StatCard
          title={selectedWellId === 'all' ? '最大降深井点' : (maxDrawdownWell ? `${maxDrawdownWell.wellName}当前埋深` : '当前井埋深')}
          value={maxDrawdownWell ? maxDrawdownWell.depth.toFixed(2) : '--'}
          unit="m"
          icon={AlertTriangle}
          color="danger"
        />

        <StatCard
          title={selectedWellId === 'all' ? '水位恢复井点' : '水位恢复状态'}
          value={recoveryWellCount}
          unit={selectedWellId === 'all' ? '口' : recoveryWellCount === 1 ? '（恢复中）' : '（未恢复）'}
          icon={TrendingDown}
          color="success"
        />
      </div>

      {maxDrawdownWell && (
        <div className="mb-6 p-4 bg-warning/5 border border-warning/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              {selectedWellId === 'all' ? (
                <>
                  <span className="font-semibold text-warning">最大降深井点：</span>
                  <span className="font-medium">{maxDrawdownWell.wellName}</span>
                  <span className="mx-2 text-gray-400">|</span>
                  当前埋深 <span className="font-mono font-semibold text-danger">{maxDrawdownWell.depth.toFixed(2)} m</span>
                  ，已接近黄色预警阈值 30m，建议重点关注。
                </>
              ) : (
                <>
                  <span className="font-semibold text-warning">当前井点：</span>
                  <span className="font-medium">{maxDrawdownWell.wellName}</span>
                  <span className="mx-2 text-gray-400">|</span>
                  当前埋深 <span className="font-mono font-semibold text-danger">{maxDrawdownWell.depth.toFixed(2)} m</span>
                  {maxDrawdownWell.depth >= 30 && '，已接近或超过黄色预警阈值 30m，建议重点关注。'}
                  {maxDrawdownWell.depth < 30 && '，处于正常范围。'}
                </>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-secondary" />
              地下水位埋深趋势
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedWellId === 'all'
                ? '近365天全市监测井点平均水位变化趋势'
                : (maxDrawdownWell ? `近365天[${maxDrawdownWell.wellName}]水位变化趋势` : '近365天水位变化趋势')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">井点：</span>
              <select
                value={selectedWellId}
                onChange={(e) => setSelectedWellId(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary bg-white"
              >
                <option value="all">全市均值</option>
                {monitoringWells.slice(0, 20).map(w => (
                  <option key={w.wellId} value={w.wellId}>{w.wellName}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
              {TIME_GRANULARITIES.map(g => (
                <button
                  key={g.key}
                  onClick={() => setGranularity(g.key)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                    granularity === g.key
                      ? 'bg-white text-secondary shadow-sm border border-secondary/20'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4">
          <ReactECharts
            option={trendChartOption}
            style={{ height: '420px', width: '100%' }}
            notMerge
            lazyUpdate
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-secondary" />
                {selectedWellId !== 'all' && maxDrawdownWell
                  ? `单井[${maxDrawdownWell.wellName}]详细数据`
                  : '多井点降深对比'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedWellId !== 'all'
                  ? '单井近90天水位变化详细数据'
                  : '近90天典型监测井点水位变化对比（支持多井切换）'}
              </p>
            </div>
            {selectedWellId === 'all' && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                点击标签选择/取消井点（最多8口）
              </div>
            )}
          </div>
          {selectedWellId === 'all' && (
            <div className="flex flex-wrap gap-2">
              {monitoringWells.slice(0, 12).map((well, idx) => {
                const selected = selectedCompareWells.includes(well.wellId)
                const color = WELL_COLORS[idx % WELL_COLORS.length]
                return (
                  <button
                    key={well.wellId}
                    onClick={() => toggleCompareWell(well.wellId)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 flex items-center gap-1.5',
                      selected
                        ? 'text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    )}
                    style={selected ? { backgroundColor: color, borderColor: color } : {}}
                  >
                    <span
                      className={cn('w-2 h-2 rounded-full', selected ? 'bg-white' : '')}
                      style={!selected ? { backgroundColor: color } : {}}
                    />
                    {well.wellName}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div className="p-4">
          <ReactECharts
            option={compareChartOption}
            style={{ height: '360px', width: '100%' }}
            notMerge
            lazyUpdate
          />
        </div>
        <div className="px-4 pb-4">
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">井号</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">井名称</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">当前埋深(m)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">月均降深(m)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">季变化(m)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">年变化(m)</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {compareTableData.map((row, idx) => (
                    <tr
                      key={row.wellId}
                      className={cn(idx % 2 === 1 ? 'bg-gray-50/30' : 'bg-white', 'hover:bg-blue-50/40 transition-colors')}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">{row.wellId}</td>
                      <td className="px-4 py-3 text-gray-800 text-xs truncate max-w-[180px]" title={row.wellName}>{row.wellName}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-gray-800">{row.current}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">{row.monthlyAvg}</td>
                      <td className={cn(
                        'px-4 py-3 text-right font-mono font-medium',
                        row.quarterlyChange > 0.5 ? 'text-danger' : row.quarterlyChange < -0.5 ? 'text-success' : 'text-gray-700'
                      )}>
                        {row.quarterlyChange > 0 ? '+' : ''}{row.quarterlyChange}
                      </td>
                      <td className={cn(
                        'px-4 py-3 text-right font-mono font-medium',
                        row.yearlyChange > 2 ? 'text-danger' : row.yearlyChange < -1 ? 'text-success' : 'text-gray-700'
                      )}>
                        {row.yearlyChange > 0 ? '+' : ''}{row.yearlyChange}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          row.statusColor
                        )}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-secondary" />
              历年同期水位对比
            </h2>
            <p className="text-sm text-gray-500">2023-2025年各月平均埋深季节性变化</p>
          </div>
          <div className="p-4">
            <ReactECharts
              option={seasonalChartOption}
              style={{ height: '320px', width: '100%' }}
              notMerge
              lazyUpdate
            />
          </div>
          <div className="px-5 pb-5 grid grid-cols-3 gap-3">
            <div className="bg-warning/5 border border-warning/15 rounded-xl p-4">
              <div className="text-xs text-warning font-medium mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-warning" />
                枯水期 (1-5月)
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-800 font-mono">{seasonalData.dryAvg}</span>
                <span className="text-xs text-gray-500">m</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">平均埋深</div>
            </div>
            <div className="bg-success/5 border border-success/15 rounded-xl p-4">
              <div className="text-xs text-success font-medium mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success" />
                丰水期 (6-9月)
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-800 font-mono">{seasonalData.wetAvg}</span>
                <span className="text-xs text-gray-500">m</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">平均埋深</div>
            </div>
            <div className="bg-danger/5 border border-danger/15 rounded-xl p-4">
              <div className="text-xs text-danger font-medium mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-danger" />
                枯水-丰水差值
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-800 font-mono">+{seasonalData.diff}</span>
                <span className="text-xs text-gray-500">m</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">枯水期更高</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-secondary" />
              多年水位趋势与预测
            </h2>
            <p className="text-sm text-gray-500">近5年实际数据 + 未来3年线性预测</p>
          </div>
          <div className="p-4">
            <ReactECharts
              option={yearlyTrendOption}
              style={{ height: '320px', width: '100%' }}
              notMerge
              lazyUpdate
            />
          </div>
          <div className="mx-5 mb-5 p-4 bg-gradient-to-r from-danger/8 via-danger/5 to-transparent border border-danger/20 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-danger mb-1">预测结论</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  按当前年均超采速率 <span className="font-mono font-semibold text-danger">+{yearlyTrendData.slope} m/年</span> 推算，
                  {yearlyTrendData.willBreak ? (
                    <>预计 <span className="font-bold text-danger text-base">{yearlyTrendData.breakYear}年</span> 将突破控制红线 <span className="font-mono font-semibold text-danger">45m</span>。</>
                  ) : (
                    <>未来3年内水位将保持在控制红线 45m 以内。</>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>年均变化: <span className="font-mono text-danger font-medium">+{yearlyTrendData.slope} m</span></span>
                  <span>预测2028年: <span className="font-mono text-gray-700 font-medium">{yearlyTrendData.predictValues[2]} m</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
