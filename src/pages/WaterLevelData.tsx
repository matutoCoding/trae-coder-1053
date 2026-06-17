import React, { useMemo, useState, useEffect } from 'react'
import {
  Activity,
  Droplets,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Calendar,
  MapPin,
  User,
  Gauge as GaugeIcon,
  Thermometer,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts/core'
import {
  GaugeChart,
  PieChart,
  LineChart,
  RadarChart,
  BarChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { monitoringWells } from '@/data/wells'
import { waterLevelRecords } from '@/data/waterLevel'
import { waterQualityRecords } from '@/data/waterQuality'
import { maintenanceRecords } from '@/data/maintenance'
import StatCard from '@/components/StatCard'
import { cn } from '@/lib/utils'

echarts.use([
  GaugeChart,
  PieChart,
  LineChart,
  RadarChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent,
  CanvasRenderer
])

const TODAY = '2026-06-18'
const DISTRICTS = ['全部', '城东区', '城西区', '城南区', '城北区', '高新区', '经开区']
const QUALITY_FLAGS = ['全部', '合格', '待复核', '缺失补全', '异常']

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return formatDate(d)
}

export default function WaterLevelData() {
  const [districtFilter, setDistrictFilter] = useState('全部')
  const [wellFilter, setWellFilter] = useState('全部')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [startDate, setStartDate] = useState('2026-06-10')
  const [endDate, setEndDate] = useState('2026-06-18')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const PAGE_SIZE = 20

  const wellMap = useMemo(() => {
    const m: Record<string, typeof monitoringWells[0]> = {}
    monitoringWells.forEach(w => { m[w.wellId] = w })
    return m
  }, [])

  const todayRecords = useMemo(() => {
    return waterLevelRecords.filter(r => r.collectionTime.startsWith(TODAY))
  }, [])

  const stats = useMemo(() => {
    const todayCount = todayRecords.length
    const avgDepth = todayCount > 0
      ? todayRecords.reduce((s, r) => s + r.waterDepth, 0) / todayCount
      : 0
    const maxDepth = todayCount > 0 ? Math.max(...todayRecords.map(r => r.waterDepth)) : 0
    const minDepth = todayCount > 0 ? Math.min(...todayRecords.map(r => r.waterDepth)) : 0
    const passCount = waterLevelRecords.filter(r => r.qualityFlag === '合格').length
    const passRate = waterLevelRecords.length > 0 ? (passCount / waterLevelRecords.length * 100) : 0
    const anomalyCount = todayRecords.filter(r => r.isAbnormal).length
    return { todayCount, avgDepth, maxDepth, minDepth, passRate, anomalyCount }
  }, [todayRecords])

  const latestRecords = useMemo(() => {
    return [...waterLevelRecords]
      .sort((a, b) => new Date(b.collectionTime).getTime() - new Date(a.collectionTime).getTime())
      .slice(0, 10)
  }, [])

  const [scrollIndex, setScrollIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setScrollIndex(i => (i + 1) % latestRecords.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [latestRecords.length])

  const filteredTableData = useMemo(() => {
    return waterLevelRecords.filter(r => {
      if (districtFilter !== '全部') {
        const well = wellMap[r.wellId]
        if (!well || well.district !== districtFilter) return false
      }
      if (wellFilter !== '全部' && r.wellId !== wellFilter) return false
      if (statusFilter !== '全部') {
        if (statusFilter === '异常' && !r.isAbnormal) return false
        if (statusFilter === '正常' && r.isAbnormal) return false
        if (['合格', '待复核', '缺失补全'].includes(statusFilter) && r.qualityFlag !== statusFilter) return false
      }
      const t = r.collectionTime.slice(0, 10)
      if (t < startDate || t > endDate) return false
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase()
        const well = wellMap[r.wellId]
        const matchId = r.wellId.toLowerCase().includes(kw)
        const matchName = well?.wellName.toLowerCase().includes(kw)
        if (!matchId && !matchName) return false
      }
      return true
    })
  }, [districtFilter, wellFilter, statusFilter, startDate, endDate, searchKeyword])

  const tableData = useMemo(() => {
    return [...filteredTableData]
      .sort((a, b) => new Date(b.collectionTime).getTime() - new Date(a.collectionTime).getTime())
      .slice(0, 500)
  }, [filteredTableData])

  const pagedData = useMemo(() => {
    const start = (tablePage - 1) * PAGE_SIZE
    return tableData.slice(start, start + PAGE_SIZE)
  }, [tableData, tablePage])

  const totalPages = Math.ceil(tableData.length / PAGE_SIZE)

  const districtWells = useMemo(() => {
    if (districtFilter === '全部') return monitoringWells
    return monitoringWells.filter(w => w.district === districtFilter)
  }, [districtFilter])

  const gaugeOption = useMemo(() => {
    const currentDepth = todayRecords.length > 0 ? todayRecords[todayRecords.length - 1].waterDepth : 25
    return {
      series: [{
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 60,
        splitNumber: 12,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#34C759' },
            { offset: 0.5, color: '#FFCC00' },
            { offset: 1, color: '#FF3B30' }
          ])
        },
        progress: { show: true, width: 20 },
        pointer: { show: true, length: '60%', width: 6 },
        axisLine: { lineStyle: { width: 20 } },
        axisTick: { distance: -30, splitNumber: 5, lineStyle: { width: 1, color: '#999' } },
        splitLine: { distance: -35, length: 8, lineStyle: { width: 2, color: '#666' } },
        axisLabel: { distance: -50, color: '#666', fontSize: 11 },
        anchor: { show: true, size: 16, itemStyle: { borderWidth: 2 } },
        title: { show: true, offsetCenter: [0, '70%'], fontSize: 14, color: '#6B7280' },
        detail: {
          valueAnimation: true,
          fontSize: 28,
          fontWeight: 'bold',
          offsetCenter: [0, '40%'],
          formatter: '{value} m',
          color: currentDepth > 45 ? '#FF3B30' : currentDepth > 30 ? '#FFCC00' : '#34C759'
        },
        data: [{ value: currentDepth.toFixed(2), name: '当前水位埋深' }]
      }]
    }
  }, [todayRecords])

  const radarOption = useMemo(() => {
    const quarterRecords = waterQualityRecords.filter(r => r.testDate >= '2026-03-01')
    const avgPh = quarterRecords.length > 0 ? quarterRecords.reduce((s, r) => s + r.ph, 0) / quarterRecords.length : 7.2
    const avgTds = quarterRecords.length > 0 ? quarterRecords.reduce((s, r) => s + r.tds, 0) / quarterRecords.length : 500
    const avgHardness = quarterRecords.length > 0 ? quarterRecords.reduce((s, r) => s + r.totalHardness, 0) / quarterRecords.length : 300
    const avgFluoride = quarterRecords.length > 0 ? quarterRecords.reduce((s, r) => s + r.fluoride, 0) / quarterRecords.length : 0.5

    return {
      tooltip: {},
      legend: { data: ['实际均值', 'Ⅲ类标准'], bottom: 0, textStyle: { fontSize: 12, color: '#6B7280' } },
      radar: {
        indicator: [
          { name: 'pH值', max: 9 },
          { name: 'TDS(mg/L)', max: 1500 },
          { name: '总硬度(mg/L)', max: 600 },
          { name: '氟化物(mg/L)', max: 1.5 },
          { name: '水温(℃)', max: 30 },
          { name: '电导率(μS/cm)', max: 1200 }
        ],
        radius: '65%',
        axisName: { color: '#4B5563', fontSize: 11 },
        splitLine: { lineStyle: { color: '#E5E7EB' } },
        splitArea: { areaStyle: { color: ['#FAFAFA', '#F3F4F6'] } }
      },
      series: [{
        type: 'radar',
        data: [
          {
            value: [avgPh.toFixed(2), avgTds.toFixed(0), avgHardness.toFixed(0), avgFluoride.toFixed(3), 17.5, 650],
            name: '实际均值',
            itemStyle: { color: '#00B8D9' },
            areaStyle: { color: 'rgba(0, 184, 217, 0.25)' },
            lineStyle: { width: 2 }
          },
          {
            value: [7.5, 1000, 450, 1.0, 25, 1000],
            name: 'Ⅲ类标准',
            itemStyle: { color: '#FFCC00' },
            areaStyle: { color: 'rgba(255, 204, 0, 0.15)' },
            lineStyle: { width: 2, type: 'dashed' }
          }
        ]
      }]
    }
  }, [])

  const qualityPieOption = useMemo(() => {
    const counts: Record<string, number> = { 'I类': 0, 'II类': 0, 'III类': 0, 'IV类': 0, 'V类': 0 }
    waterQualityRecords.forEach(r => {
      if (counts[r.waterQualityClass] !== undefined) counts[r.waterQualityClass]++
    })
    const colors = ['#34C759', '#00B8D9', '#FFCC00', '#FF9500', '#FF3B30']
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 12, color: '#6B7280' } },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, color: '#4B5563' },
        labelLine: { length: 10, length2: 8 },
        data: Object.entries(counts).map(([name, value], i) => ({
          name, value, itemStyle: { color: colors[i] }
        }))
      }]
    }
  }, [])

  const passRateLineOption = useMemo(() => {
    const months: string[] = []
    const rates: number[] = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = addMonths('2026-06-01', -i)
      const m = monthStart.slice(0, 7)
      months.push(m.slice(2))
      const mRecords = waterLevelRecords.filter(r => r.collectionTime.startsWith(m))
      const pass = mRecords.filter(r => r.qualityFlag === '合格').length
      rates.push(mRecords.length > 0 ? parseFloat((pass / mRecords.length * 100).toFixed(1)) : 95)
    }
    return {
      tooltip: { trigger: 'axis', formatter: '{b}月: {c}%' },
      grid: { left: '10%', right: '8%', top: '15%', bottom: '15%' },
      xAxis: { type: 'category', data: months, axisLine: { lineStyle: { color: '#E5E7EB' } }, axisLabel: { color: '#6B7280', fontSize: 11 } },
      yAxis: { type: 'value', min: 85, max: 100, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#6B7280', fontSize: 11, formatter: '{value}%' }, splitLine: { lineStyle: { color: '#F3F4F6' } } },
      series: [{
        type: 'line',
        data: rates,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#34C759' },
        lineStyle: { width: 3, color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#228B22' }, { offset: 1, color: '#34C759' }
        ]) },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(52, 199, 89, 0.4)' },
            { offset: 1, color: 'rgba(52, 199, 89, 0.02)' }
          ])
        }
      }]
    }
  }, [])

  const anomalyPieOption = useMemo(() => {
    const data = [
      { name: '缺测', value: 35, color: '#9CA3AF' },
      { name: '跳变', value: 28, color: '#FF9500' },
      { name: '超阈值', value: 24, color: '#FF3B30' },
      { name: '漂移', value: 13, color: '#8B5CF6' }
    ]
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 11, color: '#6B7280' } },
      series: [{
        type: 'pie',
        radius: ['40%', '68%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 10, color: '#4B5563' },
        labelLine: { length: 8, length2: 6 },
        data: data.map(d => ({ ...d, itemStyle: { color: d.color } }))
      }]
    }
  }, [])

  const recentAudits = useMemo(() => {
    const audits = [
      { date: '2026-06-17 15:32', content: '审核JCJ-023井跳变异常数据，确认设备故障已修复', person: '张海涛', status: '通过' },
      { date: '2026-06-16 10:18', content: '复核城东区5口井质控可疑数据，判定合格', person: '王建国', status: '通过' },
      { date: '2026-06-15 16:45', content: '处理JCJ-018井电导率超阈值告警，校准传感器', person: '李卫东', status: '通过' },
      { date: '2026-06-14 09:22', content: '补全6月10-12日城南区3条缺失记录', person: '刘志强', status: '通过' },
      { date: '2026-06-13 14:08', content: '审核季度水质检测报告，确认IV类水2口井', person: '陈文博', status: '通过' }
    ]
    return audits
  }, [])

  const stackedAreaOption = useMemo(() => {
    const districts = ['城东区', '城西区', '城南区', '城北区', '高新区', '经开区']
    const months: string[] = []
    for (let i = 11; i >= 0; i--) {
      const m = addMonths('2026-06-01', -i).slice(2, 7)
      months.push(m)
    }
    const colors = ['#3B82F6', '#00B8D9', '#34C759', '#FFCC00', '#FF9500', '#8B5CF6']
    const baseValues: Record<string, number[]> = {
      '城东区': [128, 135, 142, 138, 145, 152, 158, 155, 148, 142, 136, 130],
      '城西区': [98, 102, 108, 112, 105, 118, 125, 122, 115, 108, 102, 96],
      '城南区': [156, 162, 170, 168, 175, 182, 188, 185, 178, 172, 165, 158],
      '城北区': [88, 92, 98, 105, 100, 112, 118, 115, 108, 102, 95, 90],
      '高新区': [210, 225, 240, 235, 248, 260, 272, 268, 255, 245, 232, 220],
      '经开区': [178, 188, 200, 195, 208, 220, 232, 228, 218, 208, 195, 185]
    }
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { top: 0, textStyle: { fontSize: 12, color: '#6B7280' } },
      grid: { left: '3%', right: '4%', top: '15%', bottom: '10%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: months, axisLine: { lineStyle: { color: '#E5E7EB' } }, axisLabel: { color: '#6B7280', fontSize: 11 } },
      yAxis: { type: 'value', name: '万m³', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#6B7280', fontSize: 11 }, splitLine: { lineStyle: { color: '#F3F4F6' } }, nameTextStyle: { color: '#6B7280', fontSize: 11 } },
      series: districts.map((d, i) => ({
        name: d,
        type: 'line',
        stack: 'total',
        smooth: true,
        areaStyle: { color: colors[i], opacity: 0.35 },
        lineStyle: { width: 2, color: colors[i] },
        itemStyle: { color: colors[i] },
        emphasis: { focus: 'series' },
        data: baseValues[d]
      }))
    }
  }, [])

  const extractionStats = useMemo(() => {
    return [
      { district: '城东区', current: 130, yoy: 3.2, mom: -2.1 },
      { district: '城西区', current: 96, yoy: -1.5, mom: 1.8 },
      { district: '城南区', current: 158, yoy: 5.6, mom: 2.3 },
      { district: '城北区', current: 90, yoy: 0.8, mom: -0.5 },
      { district: '高新区', current: 220, yoy: 8.9, mom: 4.5 },
      { district: '经开区', current: 185, yoy: 6.2, mom: 3.1 }
    ]
  }, [])

  const handleExport = () => {
    alert('导出功能触发：当前筛选条件下共 ' + tableData.length + ' 条记录')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/40 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Droplets className="w-8 h-8 text-[#00B8D9]" />
          水位数据
        </h1>
        <p className="text-gray-500 text-base ml-11">实时采集、数据表格、水质监测、数据质控、开采量统计</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard title="今日采集数" value={stats.todayCount} unit="条" icon={Activity} color="success" trend={5.8} />
        <StatCard title="水位均值" value={stats.avgDepth.toFixed(2)} unit="m" icon={GaugeIcon} color="primary" trend={-1.2} />
        <StatCard title="最高水位" value={stats.maxDepth.toFixed(2)} unit="m" icon={TrendingUp} color="secondary" />
        <StatCard title="最低水位" value={stats.minDepth.toFixed(2)} unit="m" icon={TrendingDown} color="secondary" />
        <div className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(10,37,64,0.18)] bg-yellow-50/30">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-20" />
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="mb-3 text-sm font-medium text-slate-500">数据通过率</p>
              <div className="flex items-baseline gap-1.5">
                <span className="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-3xl font-bold leading-none tracking-tight text-transparent">
                  {stats.passRate.toFixed(1)}
                </span>
                <span className="text-sm font-medium text-slate-400">%</span>
              </div>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500/90 to-amber-500/60 text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
              style={{ boxShadow: '0 8px 20px -4px rgba(255, 204, 0, 0.45)' }}>
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <StatCard title="异常数据数" value={stats.anomalyCount} unit="条" icon={AlertTriangle} color="danger" trend={-8.5} />
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#00B8D9]" />
              实时水位采集监控
            </h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                实时采集中
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-100">
              <ReactECharts option={gaugeOption} style={{ height: '340px', width: '100%' }} notMerge />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  最近采集记录
                </h3>
                <span className="text-xs text-gray-400">自动滚动</span>
              </div>
              <div className="space-y-2 h-[280px] overflow-hidden relative">
                <div
                  className="transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateY(-${scrollIndex * 56}px)` }}
                >
                  {[...latestRecords, ...latestRecords].map((r, idx) => {
                    const well = wellMap[r.wellId]
                    const actualIdx = idx % latestRecords.length
                    return (
                      <div
                        key={`${r.recordId}-${idx}`}
                        className={cn(
                          'flex items-center justify-between py-3 px-3 rounded-xl transition-all duration-300',
                          actualIdx === scrollIndex
                            ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200'
                            : 'hover:bg-gray-50'
                        )}
                        style={{ height: '56px' }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                            r.isAbnormal ? 'bg-red-100' : 'bg-cyan-100'
                          )}>
                            <Droplets className={cn('w-4 h-4', r.isAbnormal ? 'text-red-600' : 'text-cyan-600')} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{r.wellId}</p>
                            <p className="text-xs text-gray-500">{r.collectionTime.slice(5, 16)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-800 font-mono">{r.waterDepth.toFixed(2)}<span className="text-xs font-normal text-gray-500 ml-1">m</span></p>
                            <p className="text-xs text-gray-400">{well?.district || '-'}</p>
                          </div>
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                            r.isAbnormal
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : r.qualityFlag === '合格'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : r.qualityFlag === '待复核'
                                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                          )}>
                            {r.isAbnormal ? '异常' : r.qualityFlag}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-gray-100 gap-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#00B8D9]" />
              水位采集记录明细
              <span className="text-xs font-normal text-gray-400 ml-2">最近500条 · 共 {filteredTableData.length.toLocaleString()} 条</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#0A2540] to-[#2A6DB8] rounded-lg hover:shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                导出数据
              </button>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> 区域
                </label>
                <select
                  value={districtFilter}
                  onChange={(e) => { setDistrictFilter(e.target.value); setWellFilter('全部'); setTablePage(1) }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                >
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> 井点
                </label>
                <select
                  value={wellFilter}
                  onChange={(e) => { setWellFilter(e.target.value); setTablePage(1) }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                >
                  <option value="全部">全部</option>
                  {districtWells.map(w => <option key={w.wellId} value={w.wellId}>{w.wellId}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> 状态
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setTablePage(1) }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                >
                  <option value="全部">全部</option>
                  <option value="合格">质控合格</option>
                  <option value="待复核">待复核</option>
                  <option value="缺失补全">缺失补全</option>
                  <option value="异常">异常记录</option>
                  <option value="正常">正常记录</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> 开始
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setTablePage(1) }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> 结束
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setTablePage(1) }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Search className="w-3 h-3" /> 搜索
                </label>
                <input
                  type="text"
                  placeholder="井号/井名..."
                  value={searchKeyword}
                  onChange={(e) => { setSearchKeyword(e.target.value); setTablePage(1) }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">采集时间</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">井编号</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">井名称</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">区域</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">水位埋深(m)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">水温(℃)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">电导率</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">质控标记</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">异常</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedData.map((r, idx) => {
                  const well = wellMap[r.wellId]
                  return (
                    <tr
                      key={r.recordId}
                      className={cn(
                        idx % 2 === 1 ? 'bg-gray-50/30' : 'bg-white',
                        'hover:bg-cyan-50/40 transition-colors',
                        r.isAbnormal && 'ring-2 ring-inset ring-red-300/60 bg-red-50/30'
                      )}
                    >
                      <td className="px-4 py-3 text-gray-600 text-xs font-mono whitespace-nowrap">{r.collectionTime}</td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#0A2540]">{r.wellId}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate" title={well?.wellName}>{well?.wellName || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{well?.district || '-'}</td>
                      <td className={cn(
                        'px-4 py-3 text-right font-mono font-semibold',
                        r.waterDepth > 45 ? 'text-red-600' : r.waterDepth > 30 ? 'text-amber-600' : 'text-gray-800'
                      )}>
                        {r.waterDepth.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700 flex items-center justify-end gap-1">
                        <Thermometer className="w-3 h-3 text-orange-500" />
                        {r.waterTemperature.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700 flex items-center justify-end gap-1">
                        <Zap className="w-3 h-3 text-blue-500" />
                        {r.conductivity.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
                          r.qualityFlag === '合格'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : r.qualityFlag === '待复核'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : r.qualityFlag === '缺失补全'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                        )}>
                          {r.qualityFlag === '合格' && <CheckCircle2 className="w-3 h-3" />}
                          {r.qualityFlag === '异常' && <XCircle className="w-3 h-3" />}
                          {r.qualityFlag}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.isAbnormal ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {pagedData.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 text-gray-300" />
                        <span>暂无匹配的采集记录</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-500 bg-gray-50/30">
            <span>第 <span className="font-semibold text-gray-700">{tablePage}</span> / {totalPages || 1} 页 · 显示 {pagedData.length} 条</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTablePage(p => Math.max(1, p - 1))}
                disabled={tablePage <= 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
              >
                <ChevronLeft className="w-4 h-4" /> 上一页
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (tablePage <= 3) {
                    pageNum = i + 1
                  } else if (tablePage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = tablePage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setTablePage(pageNum)}
                      className={cn(
                        'w-9 h-8 rounded-lg text-sm font-medium transition-all',
                        tablePage === pageNum
                          ? 'bg-gradient-to-r from-[#0A2540] to-[#2A6DB8] text-white shadow'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                disabled={tablePage >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
              >
                下一页 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-[#00B8D9]" />
              地下水水质监测
            </h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">最近一个季度</span>
          </div>
          <div className="p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">多指标均值对比雷达图</h3>
            <ReactECharts option={radarOption} style={{ height: '300px', width: '100%' }} notMerge />
          </div>
          <div className="p-5 pt-0 border-t border-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">水质类别分布</h3>
            <ReactECharts option={qualityPieOption} style={{ height: '260px', width: '100%' }} notMerge />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#00B8D9]" />
              数据质量控制
            </h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">近12个月</span>
          </div>
          <div className="grid grid-cols-2 gap-0 border-b border-gray-100">
            <div className="p-5 border-r border-gray-100">
              <h3 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                月度通过率趋势
              </h3>
              <ReactECharts option={passRateLineOption} style={{ height: '190px', width: '100%' }} notMerge />
            </div>
            <div className="p-5">
              <h3 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                <PieChartIcon className="w-3.5 h-3.5 text-amber-600" />
                异常类型分布
              </h3>
              <ReactECharts option={anomalyPieOption} style={{ height: '190px', width: '100%' }} notMerge />
            </div>
          </div>
          <div className="p-5 flex-1">
            <h3 className="text-xs font-semibold text-gray-600 mb-4 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-600" />
              最近质控审核
            </h3>
            <div className="relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-cyan-200 via-cyan-100 to-transparent" />
              <div className="space-y-4">
                {recentAudits.map((a, i) => (
                  <div key={i} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-white border-2 border-cyan-400 flex items-center justify-center shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-3 border border-gray-100 hover:border-cyan-200 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {a.date}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          <CheckCircle2 className="w-3 h-3" />
                          {a.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{a.content}</p>
                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        审核人：{a.person}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#00B8D9]" />
            地下水开采量统计
          </h2>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              同比↑
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              同比↓
            </span>
          </div>
        </div>
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-4">各区域月度开采量（近12个月）</h3>
          <ReactECharts option={stackedAreaOption} style={{ height: '320px', width: '100%' }} notMerge />
        </div>
        <div className="p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4">开采量同比环比分析</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {extractionStats.map((s, i) => {
              const cardColors = [
                { from: '#3B82F6', to: '#60A5FA', light: 'from-blue-50' },
                { from: '#00B8D9', to: '#26D0E8', light: 'from-cyan-50' },
                { from: '#34C759', to: '#34D399', light: 'from-green-50' },
                { from: '#FF9500', to: '#FBBF24', light: 'from-orange-50' },
                { from: '#8B5CF6', to: '#A78BFA', light: 'from-violet-50' },
                { from: '#F59E0B', to: '#FCD34D', light: 'from-amber-50' }
              ]
              const c = cardColors[i % cardColors.length]
              return (
                <div
                  key={s.district}
                  className={cn(
                    'relative overflow-hidden rounded-2xl p-4 border transition-all hover:shadow-lg hover:-translate-y-0.5',
                    'bg-gradient-to-br via-white to-white border-gray-100',
                    c.light
                  )}
                >
                  <div
                    className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-10 blur-xl"
                    style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.district}</span>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                      >
                        <Droplets className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-baseline gap-1">
                        <span
                          className="text-2xl font-bold bg-clip-text text-transparent leading-none"
                          style={{ backgroundImage: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                        >
                          {s.current}
                        </span>
                        <span className="text-xs font-medium text-gray-400">万m³</span>
                      </div>
                    </div>
                    <div className="space-y-2 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">同比</span>
                        <span className={cn(
                          'inline-flex items-center gap-0.5 text-xs font-semibold',
                          s.yoy >= 0 ? 'text-red-600' : 'text-green-600'
                        )}>
                          {s.yoy >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {Math.abs(s.yoy)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">环比</span>
                        <span className={cn(
                          'inline-flex items-center gap-0.5 text-xs font-semibold',
                          s.mom >= 0 ? 'text-red-600' : 'text-green-600'
                        )}>
                          {s.mom >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {Math.abs(s.mom)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
