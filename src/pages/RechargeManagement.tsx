import React, { useMemo, useState } from 'react'
import {
  Droplets,
  TrendingUp,
  BarChart3,
  Gauge,
  ArrowDownToLine,
  ChevronDown,
  ChevronUp,
  Eye,
  Wrench,
  CheckCircle2,
  FileText,
  Waves,
  Calendar as CalendarIcon,
  User,
  Droplet,
  Clock,
  Zap,
  FlaskConical,
  AlertCircle,
  Info,
  ArrowRight,
  ArrowLeft,
  Send,
  LineChart as LineChartIcon,
  Scale,
  Target
} from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts/core'
import {
  LineChart,
  BarChart,
  PieChart
} from 'echarts/charts'
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
import { rechargeWells, rechargeRecords } from '@/data/recharge'
import { monitoringWells as wells } from '@/data/wells'
import { waterLevelRecords } from '@/data/waterLevel'
import { maintenanceRecords } from '@/data/maintenance'
import StatCard from '@/components/StatCard'
import { cn } from '@/lib/utils'

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
  MarkAreaComponent,
  DataZoomComponent,
  CanvasRenderer
])

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  '运行中': { label: '在用', color: 'text-success bg-success/10 border-success/20' },
  '备用': { label: '停用', color: 'text-gray-500 bg-gray-100 border-gray-200' },
  '检修': { label: '维护', color: 'text-warning bg-warning/10 border-warning/20' }
}

const DISTRICT_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4'
]

const DISTRICTS = ['城东区', '城西区', '城南区', '城北区', '高新区', '经开区']

const TIME_SCALES = [
  { key: 'day', label: '日' },
  { key: 'month', label: '月' },
  { key: 'quarter', label: '季' },
  { key: 'year', label: '年' }
] as const

type TimeScale = typeof TIME_SCALES[number]['key']

interface FormStep1 {
  rechargeWellId: string
  rechargeDate: string
  operator: string
  waterSourceType: string
}

interface FormStep2 {
  volume: string
  duration: string
  rechargeMethod: string
  ph: string
  tds: string
  turbidity: string
}

interface FormStep3 {
  remarks: string
}

const WATER_SOURCE_TYPES = ['自来水', '地表水', '再生水', '其他']
const RECHARGE_METHODS = ['加压', '自流']

export default function RechargeManagement() {
  const today = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  const firstDayOfMonth = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}-01`
  }, [])

  const firstDayOfPrevMonth = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}-01`
  }, [])

  const activeWellCount = useMemo(() => {
    return rechargeWells.filter(w => STATUS_MAP[w.status]?.label === '在用').length
  }, [])

  const { currentMonthVolume, prevMonthVolume, monthlyTrend, totalCumulativeVolume } = useMemo(() => {
    let current = 0
    let prev = 0
    let total = 0
    rechargeRecords.forEach(r => {
      total += r.volume
      if (r.rechargeDate >= firstDayOfMonth) current += r.volume
      else if (r.rechargeDate >= firstDayOfPrevMonth && r.rechargeDate < firstDayOfMonth) prev += r.volume
    })
    const trend = prev > 0 ? parseFloat(((current - prev) / prev * 100).toFixed(1)) : 0
    return {
      currentMonthVolume: parseFloat(current.toFixed(1)),
      prevMonthVolume: parseFloat(prev.toFixed(1)),
      monthlyTrend: trend,
      totalCumulativeVolume: parseFloat((total / 10000).toFixed(2))
    }
  }, [firstDayOfMonth, firstDayOfPrevMonth])

  const utilizationRate = useMemo(() => {
    const totalDesign = rechargeWells.reduce((s, w) => s + w.designRechargeVolume, 0)
    const totalActual = currentMonthVolume
    if (totalDesign === 0) return 0
    return parseFloat(Math.min(100, (totalActual / (totalDesign * 30) * 100)).toFixed(1))
  }, [currentMonthVolume])

  const recoveredWellCount = useMemo(() => {
    let count = 0
    wells.forEach(well => {
      const records = waterLevelRecords
        .filter(r => r.wellId === well.wellId)
        .sort((a, b) => a.collectionTime.localeCompare(b.collectionTime))
      if (records.length >= 60) {
        const first30 = records.slice(-60, -30).reduce((s, r) => s + r.waterDepth, 0) / 30
        const last30 = records.slice(-30).reduce((s, r) => s + r.waterDepth, 0) / 30
        if (last30 < first30) count++
      }
    })
    return count
  }, [])

  const [formStep, setFormStep] = useState(1)
  const [formData1, setFormData1] = useState<FormStep1>({
    rechargeWellId: '',
    rechargeDate: today,
    operator: '',
    waterSourceType: ''
  })
  const [formData2, setFormData2] = useState<FormStep2>({
    volume: '',
    duration: '',
    rechargeMethod: '',
    ph: '',
    tds: '',
    turbidity: ''
  })
  const [formData3, setFormData3] = useState<FormStep3>({ remarks: '' })
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  const [wellFilter, setWellFilter] = useState<string>('全部')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [timeScale, setTimeScale] = useState<TimeScale>('month')

  const validateStep1 = () => {
    const errors: Record<string, boolean> = {}
    if (!formData1.rechargeWellId) errors.rechargeWellId = true
    if (!formData1.rechargeDate) errors.rechargeDate = true
    if (!formData1.operator.trim()) errors.operator = true
    if (!formData1.waterSourceType) errors.waterSourceType = true
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep2 = () => {
    const errors: Record<string, boolean> = {}
    if (!formData2.volume || parseFloat(formData2.volume) <= 0) errors.volume = true
    if (!formData2.duration || parseFloat(formData2.duration) <= 0) errors.duration = true
    if (!formData2.rechargeMethod) errors.rechargeMethod = true
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (formStep === 1 && !validateStep1()) return
    if (formStep === 2 && !validateStep2()) return
    setFormErrors({})
    if (formStep < 3) setFormStep(formStep + 1)
  }

  const handlePrev = () => {
    setFormErrors({})
    if (formStep > 1) setFormStep(formStep - 1)
  }

  const handleSubmit = () => {
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormStep(1)
      setFormData1({ rechargeWellId: '', rechargeDate: today, operator: '', waterSourceType: '' })
      setFormData2({ volume: '', duration: '', rechargeMethod: '', ph: '', tds: '', turbidity: '' })
      setFormData3({ remarks: '' })
    }, 2000)
  }

  const filteredWells = useMemo(() => {
    if (wellFilter === '全部') return rechargeWells
    return rechargeWells.filter(w => STATUS_MAP[w.status]?.label === wellFilter)
  }, [wellFilter])

  const wellCumulativeData = useMemo(() => {
    const map = new Map<string, number>()
    rechargeRecords.forEach(r => {
      map.set(r.rechargeWellId, (map.get(r.rechargeWellId) || 0) + r.volume)
    })
    return map
  }, [])

  const wellMaintenanceMap = useMemo(() => {
    const map = new Map<string, typeof maintenanceRecords>()
    maintenanceRecords.forEach(r => {
      if (!map.has(r.wellId)) map.set(r.wellId, [])
      map.get(r.wellId)!.push(r)
    })
    return map
  }, [])

  const last12MonthsLabels = useMemo(() => {
    const labels: string[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return labels
  }, [])

  const stackedAreaData = useMemo(() => {
    const result: Record<string, number[]> = {}
    DISTRICTS.forEach(d => { result[d] = new Array(12).fill(0) })
    rechargeRecords.forEach(r => {
      const monthKey = r.rechargeDate.substring(0, 7)
      const idx = last12MonthsLabels.indexOf(monthKey)
      if (idx === -1) return
      const well = rechargeWells.find(w => w.rechargeWellId === r.rechargeWellId)
      if (!well) return
      result[well.district][idx] += r.volume
    })
    return result
  }, [last12MonthsLabels])

  const stackedAreaOption = useMemo(() => {
    const series = DISTRICTS.map((district, idx) => ({
      name: district,
      type: 'line',
      stack: 'total',
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 1 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: DISTRICT_COLORS[idx] + 'CC' },
          { offset: 1, color: DISTRICT_COLORS[idx] + '10' }
        ])
      },
      itemStyle: { color: DISTRICT_COLORS[idx] },
      emphasis: { focus: 'series' },
      data: stackedAreaData[district].map(v => parseFloat(v.toFixed(1)))
    }))

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: '#374151', fontSize: 12 },
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return ''
          let html = `<div style="font-weight:600;margin-bottom:8px;color:#111827;">${params[0].axisValue}</div>`
          let total = 0
          params.forEach((p: any) => {
            total += p.value
            const marker = `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${p.color};margin-right:6px;"></span>`
            html += `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;min-width:200px;">
              <span>${marker}${p.seriesName}</span>
              <span style="font-weight:600;font-family:monospace;">${p.value.toLocaleString()} m³</span>
            </div>`
          })
          html += `<div style="border-top:1px dashed #E5E7EB;margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;">
            <span style="font-weight:600;color:#111827;">合计</span>
            <span style="font-weight:600;font-family:monospace;color:#0A2540;">${total.toFixed(0).toLocaleString()} m³</span>
          </div>`
          return html
        }
      },
      legend: {
        show: true,
        top: 0,
        right: 20,
        textStyle: { color: '#6B7280', fontSize: 12 },
        itemGap: 16
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '15%',
        containLabel: true
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        {
          type: 'slider', height: 20, bottom: 4, borderColor: 'transparent',
          backgroundColor: '#F3F4F6', fillerColor: 'rgba(59, 130, 246, 0.15)',
          handleStyle: { color: '#3B82F6', borderColor: '#fff', borderWidth: 2 },
          textStyle: { color: '#9CA3AF', fontSize: 10 }
        }
      ],
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: last12MonthsLabels,
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { show: false },
        axisLabel: { color: '#6B7280', fontSize: 11, interval: 0 }
      },
      yAxis: {
        type: 'value',
        name: '回灌量 (m³)',
        nameTextStyle: { color: '#6B7280', fontSize: 11, padding: [0, 0, 0, 40] },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#6B7280', fontSize: 11 },
        splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } }
      },
      series
    }
  }, [stackedAreaData, last12MonthsLabels])

  const districtCompareData = useMemo(() => {
    const data = DISTRICTS.map(district => {
      const values = stackedAreaData[district]
      const total = values.reduce((s, v) => s + v, 0)
      return { district, total }
    })
    const grandTotal = data.reduce((s, d) => s + d.total, 0)
    return data.map(d => ({
      ...d,
      total: parseFloat(d.total.toFixed(1)),
      ratio: grandTotal > 0 ? parseFloat((d.total / grandTotal * 100).toFixed(1)) : 0,
      yoy: parseFloat((Math.random() * 40 - 10).toFixed(1))
    }))
  }, [stackedAreaData])

  const miniBarOption = (data: number[], color: string) => ({
    backgroundColor: 'transparent',
    tooltip: { show: false },
    grid: { left: 0, right: 0, top: 2, bottom: 0 },
    xAxis: { type: 'category', show: false, data: data.map((_, i) => i) },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'bar',
      data,
      barWidth: '60%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color },
          { offset: 1, color: color + '40' }
        ]),
        borderRadius: [2, 2, 0, 0]
      }
    }]
  })

  const waterRecoveryData = useMemo(() => {
    const selectedWells = wells.slice(0, 3)
    const result = selectedWells.map(well => {
      const records = waterLevelRecords
        .filter(r => r.wellId === well.wellId)
        .sort((a, b) => a.collectionTime.localeCompare(b.collectionTime))
      const startIdx = Math.max(0, records.length - 60)
      const recent60 = records.slice(startIdx)
      return {
        well,
        before: recent60.slice(0, 30).map(r => r.waterDepth),
        after: recent60.slice(30).map(r => r.waterDepth)
      }
    })

    const beforeAvg = result.flatMap(r => r.before).reduce((s, v) => s + v, 0) / Math.max(1, result.flatMap(r => r.before).length)
    const afterAvg = result.flatMap(r => r.after).reduce((s, v) => s + v, 0) / Math.max(1, result.flatMap(r => r.after).length)
    const avgRecovery = parseFloat((beforeAvg - afterAvg).toFixed(2))
    const effectiveRate = parseFloat(Math.min(100, Math.max(0, (avgRecovery / beforeAvg * 100))).toFixed(1))

    return {
      wells: result,
      avgRecovery,
      influenceRadius: parseFloat((500 + Math.random() * 1000).toFixed(0)),
      effectiveRate
    }
  }, [])

  const waterRecoveryOption = useMemo(() => {
    const days30 = Array.from({ length: 30 }, (_, i) => `前${30 - i}天`)
    const days30After = Array.from({ length: 30 }, (_, i) => `后${i + 1}天`)
    const allDays = [...days30, ...days30After]

    const series = waterRecoveryData.wells.map((item, idx) => {
      const allData = [...item.before, ...item.after]
      return {
        name: item.well.wellName.substring(0, 8) + '...',
        fullName: item.well.wellName,
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: allData,
        lineStyle: { width: 2, color: DISTRICT_COLORS[idx] },
        itemStyle: { color: DISTRICT_COLORS[idx] }
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
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return ''
          let html = `<div style="font-weight:600;margin-bottom:8px;color:#111827;">${params[0].axisValue}</div>`
          params.forEach((p: any) => {
            const seriesDef = series.find((s: any) => s.name === p.seriesName) as any
            const marker = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>`
            html += `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;min-width:240px;">
              <span title="${seriesDef?.fullName || ''}">${marker}${seriesDef?.fullName || p.seriesName}</span>
              <span style="font-weight:600;font-family:monospace;">${p.value.toFixed(2)} m</span>
            </div>`
          })
          return html
        }
      },
      legend: {
        show: true,
        top: 0,
        right: 20,
        textStyle: { color: '#6B7280', fontSize: 11 },
        itemGap: 12,
        formatter: (name: string) => {
          const s = series.find((x: any) => x.name === name) as any
          return s?.fullName?.substring(0, 10) + (s?.fullName?.length > 10 ? '...' : '') || name
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: allDays,
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { show: false },
        axisLabel: { color: '#6B7280', fontSize: 10, interval: 9 }
      },
      yAxis: [
        {
          type: 'value',
          name: '水位埋深(m)',
          inverse: true,
          nameTextStyle: { color: '#6B7280', fontSize: 11, padding: [0, 0, 0, 40] },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#6B7280', fontSize: 11 },
          splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } }
        },
        {
          type: 'value',
          show: false
        }
      ],
      series: [
        {
          name: 'markArea_before',
          type: 'line',
          data: [],
          markArea: {
            silent: true,
            itemStyle: { color: 'rgba(239, 68, 68, 0.04)' },
            data: [[{ xAxis: 0 }, { xAxis: 29 }]]
          }
        },
        {
          name: 'markArea_after',
          type: 'line',
          data: [],
          markArea: {
            silent: true,
            itemStyle: { color: 'rgba(16, 185, 129, 0.06)' },
            label: {
              show: true,
              position: 'insideTopRight',
              color: '#10B981',
              fontSize: 10,
              fontWeight: 600,
              formatter: '回灌启动后'
            },
            data: [[{ xAxis: 30 }, { xAxis: 59 }]]
          }
        },
        {
          name: 'markLine_start',
          type: 'line',
          data: [],
          markLine: {
            silent: false,
            symbol: 'none',
            lineStyle: { type: 'dashed', color: '#10B981', width: 2 },
            label: {
              formatter: '回灌启动',
              fontSize: 11,
              color: '#10B981',
              fontWeight: 600
            },
            data: [{ xAxis: 29.5 }]
          }
        },
        ...series
      ]
    }
  }, [waterRecoveryData])

  const balanceChartData = useMemo(() => {
    const labels = last12MonthsLabels
    const extraction: number[] = []
    const recharge: number[] = []

    labels.forEach((month, idx) => {
      let monthRecharge = 0
      DISTRICTS.forEach(d => { monthRecharge += stackedAreaData[d][idx] })
      const baseExtraction = monthRecharge * (1.2 + Math.random() * 0.8)
      recharge.push(parseFloat(monthRecharge.toFixed(0)))
      extraction.push(parseFloat(baseExtraction.toFixed(0)))
    })

    const netRecharge = recharge.map((r, i) => parseFloat((r - extraction[i]).toFixed(0)))
    const thisMonthNet = netRecharge[netRecharge.length - 1]
    const yearBalance = parseFloat(((recharge.reduce((s, v) => s + v, 0) / extraction.reduce((s, v) => s + v, 0)) * 100).toFixed(1))
    const targetRate = 60
    const isQualified = yearBalance >= targetRate

    return { labels, extraction, recharge, netRecharge, thisMonthNet, yearBalance, targetRate, isQualified }
  }, [last12MonthsLabels, stackedAreaData])

  const balanceOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: '#374151', fontSize: 12 },
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return ''
          let html = `<div style="font-weight:600;margin-bottom:8px;color:#111827;">${params[0].axisValue}</div>`
          let net = 0
          params.forEach((p: any) => {
            const isNet = p.seriesName === '净补给量'
            const v = isNet ? p.value : Math.abs(p.value)
            net = balanceChartData.netRecharge[params[0].dataIndex]
            const marker = `<span style="display:inline-block;width:10px;height:10px;border-radius:${isNet ? '50%' : '2px'};background:${p.color};margin-right:6px;"></span>`
            html += `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;min-width:200px;">
              <span>${marker}${p.seriesName}</span>
              <span style="font-weight:600;font-family:monospace;${!isNet && p.seriesName === '开采量' ? 'color:#EF4444' : !isNet ? 'color:#3B82F6' : ''}">${isNet && net < 0 ? '-' : ''}${v.toLocaleString()} m³</span>
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
        itemGap: 16
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: balanceChartData.labels,
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { show: false },
        axisLabel: { color: '#6B7280', fontSize: 11, interval: 1 }
      },
      yAxis: {
        type: 'value',
        name: '水量 (m³)',
        nameTextStyle: { color: '#6B7280', fontSize: 11, padding: [0, 0, 0, 40] },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#6B7280',
          fontSize: 11,
          formatter: (v: number) => Math.abs(v).toLocaleString()
        },
        splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } }
      },
      series: [
        {
          name: '开采量',
          type: 'bar',
          stack: 'extraction',
          barWidth: '38%',
          data: balanceChartData.extraction,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#EF4444CC' },
              { offset: 1, color: '#EF444440' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: '回灌量',
          type: 'bar',
          stack: 'recharge',
          barWidth: '38%',
          data: balanceChartData.recharge.map(v => -v),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#3B82F640' },
              { offset: 1, color: '#3B82F6CC' }
            ]),
            borderRadius: [0, 0, 4, 4]
          }
        },
        {
          name: '净补给量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          data: balanceChartData.netRecharge,
          lineStyle: { width: 2.5, color: '#8B5CF6' },
          itemStyle: { color: '#8B5CF6', borderColor: '#fff', borderWidth: 2 },
          z: 10
        }
      ]
    }
  }, [balanceChartData])

  const selectedWellInfo = useMemo(() => {
    if (!formData1.rechargeWellId) return null
    return rechargeWells.find(w => w.rechargeWellId === formData1.rechargeWellId)
  }, [formData1.rechargeWellId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Droplets className="w-8 h-8 text-secondary" />
          回灌管理
        </h1>
        <p className="text-gray-500 text-base ml-11">回灌登记、回灌井管理、回灌量统计、效果评估</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
        <StatCard
          title="在用回灌井"
          value={activeWellCount}
          unit="口"
          icon={Waves}
          color="primary"
        />
        <StatCard
          title="本月回灌量"
          value={currentMonthVolume.toLocaleString()}
          unit="m³"
          icon={BarChart3}
          trend={monthlyTrend}
          color="success"
        />
        <StatCard
          title="累计回灌量"
          value={totalCumulativeVolume.toLocaleString()}
          unit="万m³"
          icon={TrendingUp}
          color="secondary"
        />
        <StatCard
          title="设计能力利用率"
          value={utilizationRate}
          unit="%"
          icon={Gauge}
          color="warning"
        />
        <StatCard
          title="水位恢复井点"
          value={recoveredWellCount}
          unit="口"
          icon={ArrowDownToLine}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-secondary" />
                人工回灌作业登记
              </h2>
              {submitted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  提交成功
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(step => (
                <React.Fragment key={step}>
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    formStep === step
                      ? 'bg-secondary/10 text-secondary border border-secondary/30'
                      : formStep > step
                        ? 'bg-success/10 text-success'
                        : 'bg-gray-50 text-gray-400'
                  )}>
                    <div className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                      formStep === step
                        ? 'bg-secondary text-white'
                        : formStep > step
                          ? 'bg-success text-white'
                          : 'bg-gray-200 text-gray-500'
                    )}>
                      {formStep > step ? <CheckCircle2 className="w-3 h-3" /> : step}
                    </div>
                    <span>{step === 1 ? '基础信息' : step === 2 ? '回灌参数' : '确认提交'}</span>
                  </div>
                  {step < 3 && <div className={cn(
                    'flex-1 h-0.5 rounded',
                    formStep > step ? 'bg-success/40' : 'bg-gray-200'
                  )} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="p-5">
            {formStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    回灌井 <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formData1.rechargeWellId}
                    onChange={e => setFormData1({ ...formData1, rechargeWellId: e.target.value })}
                    className={cn(
                      'w-full px-3 py-2.5 text-sm border rounded-lg transition-all focus:outline-none focus:ring-2',
                      formErrors.rechargeWellId
                        ? 'border-danger focus:ring-danger/30'
                        : 'border-gray-200 focus:border-secondary focus:ring-secondary/30 bg-white'
                    )}
                  >
                    <option value="">请选择回灌井</option>
                    {rechargeWells.filter(w => STATUS_MAP[w.status]?.label === '在用').map(w => (
                      <option key={w.rechargeWellId} value={w.rechargeWellId}>
                        {w.rechargeWellId} - {w.wellName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 inline mr-1" />
                      回灌日期 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData1.rechargeDate}
                      onChange={e => setFormData1({ ...formData1, rechargeDate: e.target.value })}
                      className={cn(
                        'w-full px-3 py-2.5 text-sm border rounded-lg transition-all focus:outline-none focus:ring-2',
                        formErrors.rechargeDate
                          ? 'border-danger focus:ring-danger/30'
                          : 'border-gray-200 focus:border-secondary focus:ring-secondary/30'
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <User className="w-3.5 h-3.5 inline mr-1" />
                      操作人员 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData1.operator}
                      onChange={e => setFormData1({ ...formData1, operator: e.target.value })}
                      placeholder="请输入操作人员姓名"
                      className={cn(
                        'w-full px-3 py-2.5 text-sm border rounded-lg transition-all focus:outline-none focus:ring-2',
                        formErrors.operator
                          ? 'border-danger focus:ring-danger/30'
                          : 'border-gray-200 focus:border-secondary focus:ring-secondary/30'
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Droplet className="w-3.5 h-3.5 inline mr-1" />
                    水源类型 <span className="text-danger">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {WATER_SOURCE_TYPES.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData1({ ...formData1, waterSourceType: type })}
                        className={cn(
                          'px-3 py-2 text-xs font-medium rounded-lg border transition-all',
                          formData1.waterSourceType === type
                            ? 'bg-secondary/10 text-secondary border-secondary/30 shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
                          formErrors.waterSourceType && !formData1.waterSourceType
                            ? 'border-danger'
                            : ''
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {formStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <BarChart3 className="w-3.5 h-3.5 inline mr-1" />
                      回灌水量 <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData2.volume}
                        onChange={e => setFormData2({ ...formData2, volume: e.target.value })}
                        placeholder="0.00"
                        step="0.1"
                        min="0"
                        className={cn(
                          'w-full px-3 py-2.5 pr-12 text-sm border rounded-lg transition-all focus:outline-none focus:ring-2 font-mono',
                          formErrors.volume
                            ? 'border-danger focus:ring-danger/30'
                            : 'border-gray-200 focus:border-secondary focus:ring-secondary/30'
                        )}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">m³</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Clock className="w-3.5 h-3.5 inline mr-1" />
                      回灌时长 <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData2.duration}
                        onChange={e => setFormData2({ ...formData2, duration: e.target.value })}
                        placeholder="0.0"
                        step="0.5"
                        min="0"
                        className={cn(
                          'w-full px-3 py-2.5 pr-12 text-sm border rounded-lg transition-all focus:outline-none focus:ring-2 font-mono',
                          formErrors.duration
                            ? 'border-danger focus:ring-danger/30'
                            : 'border-gray-200 focus:border-secondary focus:ring-secondary/30'
                        )}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">小时</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Zap className="w-3.5 h-3.5 inline mr-1" />
                    回灌方式 <span className="text-danger">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {RECHARGE_METHODS.map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData2({ ...formData2, rechargeMethod: method })}
                        className={cn(
                          'px-4 py-2.5 text-sm font-medium rounded-lg border transition-all flex items-center justify-center gap-2',
                          formData2.rechargeMethod === method
                            ? 'bg-secondary/10 text-secondary border-secondary/30 shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
                          formErrors.rechargeMethod && !formData2.rechargeMethod
                            ? 'border-danger'
                            : ''
                        )}
                      >
                        {method === '加压' ? <Zap className="w-4 h-4" /> : <ArrowDownToLine className="w-4 h-4" />}
                        {method}回灌
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <FlaskConical className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-semibold text-gray-700">水质检测参数（选填）</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">pH值</label>
                      <input
                        type="number"
                        value={formData2.ph}
                        onChange={e => setFormData2({ ...formData2, ph: e.target.value })}
                        placeholder="6.5-8.5"
                        step="0.01"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">TDS (mg/L)</label>
                      <input
                        type="number"
                        value={formData2.tds}
                        onChange={e => setFormData2({ ...formData2, tds: e.target.value })}
                        placeholder="≤1000"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">浊度 (NTU)</label>
                      <input
                        type="number"
                        value={formData2.turbidity}
                        onChange={e => setFormData2({ ...formData2, turbidity: e.target.value })}
                        placeholder="≤5"
                        step="0.1"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {formStep === 3 && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50/60 to-cyan-50/60 rounded-xl border border-blue-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-semibold text-gray-700">信息确认</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-gray-500 shrink-0 w-20">回灌井：</span>
                      <span className="text-gray-800 font-medium">
                        {selectedWellInfo ? `${selectedWellInfo.rechargeWellId} - ${selectedWellInfo.wellName}` : '--'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-gray-500 shrink-0 w-20">回灌日期：</span>
                      <span className="text-gray-800 font-medium font-mono">{formData1.rechargeDate}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-gray-500 shrink-0 w-20">操作人员：</span>
                      <span className="text-gray-800 font-medium">{formData1.operator}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-gray-500 shrink-0 w-20">水源类型：</span>
                      <span className="text-gray-800 font-medium">{formData1.waterSourceType}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-gray-500 shrink-0 w-20">回灌水量：</span>
                      <span className="text-gray-800 font-medium font-mono">{formData2.volume} m³</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-gray-500 shrink-0 w-20">回灌时长：</span>
                      <span className="text-gray-800 font-medium font-mono">{formData2.duration} 小时</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-gray-500 shrink-0 w-20">回灌方式：</span>
                      <span className="text-gray-800 font-medium">{formData2.rechargeMethod}</span>
                    </div>
                    {(formData2.ph || formData2.tds || formData2.turbidity) && (
                      <div className="flex items-start gap-3">
                        <span className="text-gray-500 shrink-0 w-20">水质检测：</span>
                        <span className="text-gray-800 font-medium font-mono text-xs">
                          {formData2.ph && `pH ${formData2.ph}`}
                          {formData2.tds && `  TDS ${formData2.tds}`}
                          {formData2.turbidity && `  浊度 ${formData2.turbidity}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    备注说明
                  </label>
                  <textarea
                    value={formData3.remarks}
                    onChange={e => setFormData3({ remarks: e.target.value })}
                    rows={4}
                    placeholder="请输入回灌作业备注信息（如回灌压力变化、设备运行情况、异常现象等）..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="px-5 pb-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={formStep === 1}
              className={cn(
                'px-4 py-2.5 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-all',
                formStep === 1
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              上一步
            </button>
            {formStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-secondary to-secondary/80 rounded-lg shadow-sm hover:shadow-md hover:from-secondary/90 hover:to-secondary/70 transition-all flex items-center gap-1.5"
              >
                下一步
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitted}
                className={cn(
                  'px-6 py-2.5 text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5',
                  submitted
                    ? 'bg-success text-white cursor-default'
                    : 'bg-gradient-to-r from-success to-success/80 text-white hover:shadow-md hover:from-success/90 hover:to-success/70'
                )}
              >
                <Send className="w-4 h-4" />
                {submitted ? '已提交' : '确认提交'}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Waves className="w-5 h-5 text-secondary" />
                回灌井档案
              </h2>
              <span className="text-xs text-gray-400">共 {rechargeWells.length} 口井</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
              {['全部', '在用', '停用', '维护'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setWellFilter(tab)}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                    wellFilter === tab
                      ? 'bg-white text-secondary shadow-sm border border-secondary/20'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                  )}
                >
                  {tab}
                  <span className={cn(
                    'ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                    wellFilter === tab ? 'bg-secondary/10 text-secondary' : 'bg-gray-200 text-gray-500'
                  )}>
                    {tab === '全部' ? rechargeWells.length :
                      rechargeWells.filter(w => STATUS_MAP[w.status]?.label === tab).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[640px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">井编号</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">井名称 / 区域</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">设计能力</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">状态</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">累计/利用率</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredWells.map(well => {
                  const cumulative = wellCumulativeData.get(well.rechargeWellId) || 0
                  const utilization = well.designRechargeVolume > 0
                    ? Math.min(100, cumulative / (well.designRechargeVolume * 365 * 2) * 100)
                    : 0
                  const statusInfo = STATUS_MAP[well.status] || { label: well.status, color: 'text-gray-500 bg-gray-100' }
                  const mRecords = wellMaintenanceMap.get(well.rechargeWellId) || []
                  const isExpanded = expandedRow === well.rechargeWellId

                  return (
                    <React.Fragment key={well.rechargeWellId}>
                      <tr
                        className={cn(
                          'hover:bg-blue-50/40 transition-colors cursor-pointer',
                          isExpanded ? 'bg-blue-50/60' : ''
                        )}
                        onClick={() => setExpandedRow(isExpanded ? null : well.rechargeWellId)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-gray-700">{well.rechargeWellId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium text-gray-800 truncate max-w-[140px]" title={well.wellName}>
                            {well.wellName}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            {well.district} · {well.rechargeWaterSource.substring(0, 6)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-mono text-xs font-semibold text-gray-700">
                            {well.designRechargeVolume}
                          </div>
                          <div className="text-[10px] text-gray-400">m³/日</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                            statusInfo.color
                          )}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-right mb-1">
                            <span className="font-mono text-xs font-semibold text-gray-700">
                              {(cumulative / 10000).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-gray-400 ml-1">万m³</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                utilization > 80 ? 'bg-success' : utilization > 50 ? 'bg-secondary' : utilization > 20 ? 'bg-warning' : 'bg-gray-300'
                              )}
                              style={{ width: `${utilization}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-gray-400 text-right mt-0.5">
                            利用率 {utilization.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <button className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="查看">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title="维护">
                              <Wrench className="w-3.5 h-3.5" />
                            </button>
                            <button
                              className={cn(
                                'p-1.5 rounded-lg transition-colors',
                                isExpanded ? 'bg-secondary/10 text-secondary' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                              )}
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50/60 px-4 py-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Wrench className="w-3.5 h-3.5 text-warning" />
                              <span className="text-xs font-semibold text-gray-700">维护记录</span>
                              <span className="text-[10px] text-gray-400">({mRecords.length} 条)</span>
                            </div>
                            {mRecords.length > 0 ? (
                              <div className="space-y-2">
                                {mRecords.slice(0, 3).map(r => (
                                  <div key={r.recordId} className="bg-white rounded-lg border border-gray-100 p-3 text-xs">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-warning/10 text-warning font-semibold text-[10px]">
                                        {r.maintenanceType}
                                      </span>
                                      <span className="text-gray-400 font-mono">{r.maintenanceDate}</span>
                                    </div>
                                    <p className="text-gray-600 mb-1">{r.content}</p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-400">维护人：{r.maintenancePerson}</span>
                                      <span className="text-success">{r.result}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 text-center py-4 bg-white rounded-lg border border-dashed border-gray-200">
                                暂无维护记录
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              回灌量统计分析
            </h2>
            <p className="text-sm text-gray-500 mt-1">近12个月各区域回灌量分布</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            {TIME_SCALES.map(scale => (
              <button
                key={scale.key}
                onClick={() => setTimeScale(scale.key)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  timeScale === scale.key
                    ? 'bg-white text-secondary shadow-sm border border-secondary/20'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                )}
              >
                {scale.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4">
          <ReactECharts
            option={stackedAreaOption}
            style={{ height: '380px', width: '100%' }}
            notMerge
            lazyUpdate
          />
        </div>
        <div className="px-4 pb-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {districtCompareData.map((item, idx) => {
            const color = DISTRICT_COLORS[idx]
            return (
              <div
                key={item.district}
                className="rounded-xl border border-gray-100 p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ backgroundColor: color + '05', borderColor: color + '20' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-semibold text-gray-800">{item.district}</span>
                  </div>
                  <span className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5',
                    item.yoy >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                  )}>
                    {item.yoy >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <LineChartIcon className="w-2.5 h-2.5 rotate-180" />}
                    {item.yoy >= 0 ? '+' : ''}{item.yoy}%
                  </span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold text-gray-800 font-mono">
                      {item.total.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-400">m³ 回灌量</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color }}>
                      {item.ratio}%
                    </div>
                    <div className="text-[10px] text-gray-400">占比</div>
                  </div>
                </div>
                <div className="h-14">
                  <ReactECharts
                    option={miniBarOption(stackedAreaData[item.district], color)}
                    style={{ height: '56px', width: '100%' }}
                    notMerge
                    lazyUpdate
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-1">
              <ArrowDownToLine className="w-5 h-5 text-success" />
              回灌前后水位恢复对比
            </h2>
            <p className="text-sm text-gray-500">回灌区典型监测井回灌前后30天水位变化</p>
          </div>
          <div className="p-4">
            <ReactECharts
              option={waterRecoveryOption}
              style={{ height: '340px', width: '100%' }}
              notMerge
              lazyUpdate
            />
          </div>
          <div className="px-5 pb-5 grid grid-cols-3 gap-3">
            <div className="bg-success/5 border border-success/15 rounded-xl p-4">
              <div className="text-xs text-success font-medium mb-1 flex items-center gap-1">
                <ArrowDownToLine className="w-3 h-3" />
                平均回升值
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-800 font-mono">{waterRecoveryData.avgRecovery > 0 ? '+' : ''}{waterRecoveryData.avgRecovery}</span>
                <span className="text-xs text-gray-500">m</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">水位回升（埋深减小）</div>
            </div>
            <div className="bg-secondary/5 border border-secondary/15 rounded-xl p-4">
              <div className="text-xs text-secondary font-medium mb-1 flex items-center gap-1">
                <Target className="w-3 h-3" />
                影响半径
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-800 font-mono">{waterRecoveryData.influenceRadius}</span>
                <span className="text-xs text-gray-500">m</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">回灌有效影响范围</div>
            </div>
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
              <div className="text-xs text-primary font-medium mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                有效率
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-800 font-mono">{waterRecoveryData.effectiveRate}</span>
                <span className="text-xs text-gray-500">%</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">水位达标恢复比例</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-1">
              <Scale className="w-5 h-5 text-primary" />
              地下水开采-回灌水量平衡
            </h2>
            <p className="text-sm text-gray-500">近12个月开采量与回灌量对比分析</p>
          </div>
          <div className="p-4">
            <ReactECharts
              option={balanceOption}
              style={{ height: '340px', width: '100%' }}
              notMerge
              lazyUpdate
            />
          </div>
          <div className="px-5 pb-5 grid grid-cols-3 gap-3">
            <div className={cn(
              'rounded-xl p-4 border',
              balanceChartData.thisMonthNet >= 0
                ? 'bg-success/5 border-success/15'
                : 'bg-danger/5 border-danger/15'
            )}>
              <div className={cn(
                'text-xs font-medium mb-1 flex items-center gap-1',
                balanceChartData.thisMonthNet >= 0 ? 'text-success' : 'text-danger'
              )}>
                <Droplets className="w-3 h-3" />
                本月净补给
              </div>
              <div className="flex items-baseline gap-1">
                <span className={cn(
                  'text-2xl font-bold font-mono',
                  balanceChartData.thisMonthNet >= 0 ? 'text-success' : 'text-danger'
                )}>
                  {balanceChartData.thisMonthNet >= 0 ? '+' : ''}{balanceChartData.thisMonthNet.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">m³</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {balanceChartData.thisMonthNet >= 0 ? '回灌大于开采' : '开采大于回灌'}
              </div>
            </div>
            <div className="bg-warning/5 border border-warning/15 rounded-xl p-4">
              <div className="text-xs text-warning font-medium mb-1 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                年度平衡率
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-800 font-mono">{balanceChartData.yearBalance}</span>
                <span className="text-xs text-gray-500">%</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">目标值 ≥ {balanceChartData.targetRate}%</div>
            </div>
            <div className={cn(
              'rounded-xl p-4 border',
              balanceChartData.isQualified
                ? 'bg-success/5 border-success/15'
                : 'bg-danger/5 border-danger/15'
            )}>
              <div className={cn(
                'text-xs font-medium mb-1 flex items-center gap-1',
                balanceChartData.isQualified ? 'text-success' : 'text-danger'
              )}>
                {balanceChartData.isQualified ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                达标情况
              </div>
              <div className="flex items-baseline gap-1">
                <span className={cn(
                  'text-2xl font-bold',
                  balanceChartData.isQualified ? 'text-success' : 'text-danger'
                )}>
                  {balanceChartData.isQualified ? '已达标' : '未达标'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                差距 {Math.max(0, balanceChartData.targetRate - balanceChartData.yearBalance).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
