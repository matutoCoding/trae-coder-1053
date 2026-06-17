import React, { useMemo, useState } from 'react'
import {
  FileText,
  FileBarChart,
  History,
  Wrench,
  FileCheck2,
  Plus,
  Clock,
  Download,
  Printer,
  FileSpreadsheet,
  FileJson,
  Settings,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  Filter,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Radar as RadarIcon,
  Table as TableIcon,
  Save,
  Palette,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Thermometer,
  Beaker,
  Gauge as GaugeIcon,
  Waves,
  Mountain,
  AlertTriangle,
  Bell,
  ShieldAlert,
  User
} from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts/core'
import {
  GaugeChart,
  PieChart,
  LineChart,
  RadarChart,
  BarChart,
  ScatterChart,
  FunnelChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent,
  VisualMapComponent,
  DataZoomComponent,
  GraphicComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { monitoringWells } from '@/data/wells'
import { waterLevelRecords } from '@/data/waterLevel'
import { waterQualityRecords } from '@/data/waterQuality'
import { subsidenceRecords } from '@/data/subsidence'
import { warningEvents } from '@/data/warnings'
import { rechargeRecords } from '@/data/recharge'
import { maintenanceRecords } from '@/data/maintenance'
import StatCard from '@/components/StatCard'
import { cn } from '@/lib/utils'

echarts.use([
  GaugeChart,
  PieChart,
  LineChart,
  RadarChart,
  BarChart,
  ScatterChart,
  FunnelChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent,
  VisualMapComponent,
  DataZoomComponent,
  GraphicComponent,
  CanvasRenderer
])

const TABS = [
  { id: 'annual', name: '年度通报', icon: FileText },
  { id: 'custom', name: '自定义报表', icon: FileBarChart },
  { id: 'history', name: '历史数据查询', icon: History },
  { id: 'maintenance', name: '设备维护报告', icon: Wrench }
]

const DISTRICTS = ['城东区', '城西区', '城南区', '城北区', '高新区', '经开区']
const YEARS = ['2022', '2023', '2024', '2025']
const QUARTERS = [
  { value: '全年', label: '全年' },
  { value: 'Q1', label: 'Q1（1-3月）' },
  { value: 'Q2', label: 'Q2（4-6月）' },
  { value: 'Q3', label: 'Q3（7-9月）' },
  { value: 'Q4', label: 'Q4（10-12月）' }
]
const CHAPTERS = [
  { id: 'overview', name: '概述' },
  { id: 'waterLevel', name: '水位状况' },
  { id: 'drawdown', name: '降深趋势' },
  { id: 'subsidence', name: '地面沉降' },
  { id: 'warning', name: '超采预警' },
  { id: 'recharge', name: '回灌效果' },
  { id: 'quality', name: '水质状况' },
  { id: 'problem', name: '存在问题' },
  { id: 'suggestion', name: '对策建议' }
]
const TEMPLATES = [
  { id: 'formal', name: '正式版' },
  { id: 'simple', name: '简版' },
  { id: 'leader', name: '领导参阅版' }
]
const CUSTOM_INDICATORS = [
  { id: 'waterDepth', name: '水位埋深', unit: 'm', icon: Droplets },
  { id: 'waterTemp', name: '水温', unit: '℃', icon: Thermometer },
  { id: 'ph', name: 'pH值', unit: '', icon: Beaker },
  { id: 'tds', name: 'TDS', unit: 'mg/L', icon: Beaker },
  { id: 'hardness', name: '总硬度', unit: 'mg/L', icon: Beaker },
  { id: 'fluoride', name: '氟化物', unit: 'mg/L', icon: Beaker },
  { id: 'conductivity', name: '电导率', unit: 'μS/cm', icon: GaugeIcon },
  { id: 'extraction', name: '开采量', unit: '万m³', icon: Waves },
  { id: 'recharge', name: '回灌量', unit: '万m³', icon: Waves },
  { id: 'subsidence', name: '沉降量', unit: 'mm', icon: Mountain },
  { id: 'warningCount', name: '预警次数', unit: '次', icon: AlertTriangle },
  { id: 'warningRed', name: '红色预警', unit: '次', icon: ShieldAlert },
  { id: 'warningOrange', name: '橙色预警', unit: '次', icon: AlertCircle },
  { id: 'wellOnline', name: '在线井点', unit: '个', icon: CheckCircle2 },
  { id: 'wellOffline', name: '离线井点', unit: '个', icon: XCircle },
  { id: 'dataPass', name: '数据通过率', unit: '%', icon: FileCheck2 },
  { id: 'maintenanceCount', name: '维护次数', unit: '次', icon: Wrench },
  { id: 'pumpChange', name: '水泵更换', unit: '次', icon: Wrench },
  { id: 'sensorCal', name: '传感器校准', unit: '次', icon: Settings },
  { id: 'dailyCheck', name: '日常巡检', unit: '次', icon: Eye },
  { id: 'rechargeWell', name: '回灌井点', unit: '个', icon: Droplets },
  { id: 'qualityClass', name: '水质类别', unit: '类', icon: Beaker }
]
const CHART_TYPES = [
  { id: 'line', name: '折线图', icon: LineChartIcon },
  { id: 'bar', name: '柱状图', icon: BarChart3 },
  { id: 'pie', name: '饼图', icon: PieChartIcon },
  { id: 'area', name: '面积图', icon: LineChartIcon },
  { id: 'radar', name: '雷达图', icon: RadarIcon },
  { id: 'table', name: '数据表格', icon: TableIcon }
]
const COLOR_SCHEMES = [
  { id: 'default', name: '默认蓝绿', colors: ['#3B82F6', '#00B8D9', '#34C759', '#FFCC00', '#FF9500'] },
  { id: 'ocean', name: '海洋蓝', colors: ['#0369A1', '#0284C7', '#0EA5E9', '#38BDF8', '#7DD3FC'] },
  { id: 'forest', name: '森林绿', colors: ['#166534', '#15803D', '#22C55E', '#4ADE80', '#86EFAC'] },
  { id: 'sunset', name: '日落橙', colors: ['#9A3412', '#C2410C', '#EA580C', '#F97316', '#FB923C'] },
  { id: 'violet', name: '紫罗兰', colors: ['#581C87', '#6B21A8', '#7C3AED', '#8B5CF6', '#A78BFA'] },
  { id: 'rose', name: '玫瑰红', colors: ['#9F1239', '#BE123C', '#E11D48', '#F43F5E', '#FB7185'] }
]
const HISTORY_DATA_TYPES = [
  { id: 'waterLevel', name: '水位数据' },
  { id: 'waterQuality', name: '水质数据' },
  { id: 'subsidence', name: '沉降数据' },
  { id: 'recharge', name: '回灌数据' },
  { id: 'warning', name: '预警数据' },
  { id: 'maintenance', name: '维护数据' }
]
const QUICK_RANGES = [
  { id: '7d', name: '近7天', days: 7 },
  { id: '30d', name: '近30天', days: 30 },
  { id: '90d', name: '近90天', days: 90 },
  { id: '1y', name: '近1年', days: 365 },
  { id: '3y', name: '近3年', days: 1095 },
  { id: 'custom', name: '自定义', days: 0 }
]
const GRANULARITIES = ['日', '周', '月', '季', '年']
const SORT_ORDERS = [
  { id: 'default', name: '默认排序' },
  { id: 'time_asc', name: '时间升序' },
  { id: 'time_desc', name: '时间降序' },
  { id: 'value_asc', name: '数值升序' },
  { id: 'value_desc', name: '数值降序' }
]

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const TODAY = '2026-06-18'

export default function ReportGeneration() {
  const [activeTab, setActiveTab] = useState('annual')

  const stats = useMemo(() => ({
    totalReports: 186,
    monthlyNew: 12,
    pendingApproval: 5,
    totalExports: 1024
  }), [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/40 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <FileBarChart className="w-8 h-8 text-[#00B8D9]" />
          报告生成
        </h1>
        <p className="text-gray-500 text-base ml-11">年度通报、自定义报表、历史数据查询、设备维护报告、多格式导出</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 mb-6 overflow-hidden shadow-sm">
        <div className="flex items-center border-b border-gray-100 px-2">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative',
                  isActive
                    ? 'text-[#0A2540] bg-gradient-to-b from-cyan-50/60 to-transparent'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-[#00B8D9]' : '')} />
                {tab.name}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0A2540] via-[#00B8D9] to-[#2A6DB8]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="已生成报告数" value={stats.totalReports} unit="份" icon={FileText} color="primary" trend={8.5} />
        <StatCard title="本月新增" value={stats.monthlyNew} unit="份" icon={Plus} color="success" trend={20} />
        <StatCard title="待审批" value={stats.pendingApproval} unit="份" icon={Clock} color="warning" trend={-15} />
        <StatCard title="累计导出次数" value={stats.totalExports} unit="次" icon={Download} color="secondary" trend={12.3} />
      </div>

      {activeTab === 'annual' && <AnnualReportTab />}
      {activeTab === 'custom' && <CustomReportTab />}
      {activeTab === 'history' && <HistoryQueryTab />}
      {activeTab === 'maintenance' && <MaintenanceReportTab />}
    </div>
  )
}

function AnnualReportTab() {
  const [year, setYear] = useState('2025')
  const [quarter, setQuarter] = useState('全年')
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(['城东区', '城西区'])
  const [selectedChapters, setSelectedChapters] = useState<string[]>(['overview', 'waterLevel', 'drawdown', 'subsidence'])
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeRawData, setIncludeRawData] = useState(false)
  const [template, setTemplate] = useState('formal')
  const [showAdvanced, setShowAdvanced] = useState(true)

  const toggleDistrict = (d: string) => {
    setSelectedDistricts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }
  const toggleChapter = (c: string) => {
    setSelectedChapters(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  const waterLevelChartOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: '12%', right: '5%', top: '15%', bottom: '18%' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      axisLine: { lineStyle: { color: '#D1D5DB' } },
      axisLabel: { color: '#6B7280', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: 'm',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#6B7280', fontSize: 10 },
      splitLine: { lineStyle: { color: '#F3F4F6' } }
    },
    series: [{
      type: 'bar',
      data: [22.5, 23.1, 24.8, 26.2, 28.5, 30.1, 31.8, 32.5, 30.6, 28.2, 25.4, 23.8],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#00B8D9' },
          { offset: 1, color: 'rgba(0, 184, 217, 0.2)' }
        ]),
        borderRadius: [3, 3, 0, 0]
      },
      barWidth: '50%'
    }]
  }), [])

  const drawdownChartOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: '12%', right: '5%', top: '15%', bottom: '18%' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      axisLine: { lineStyle: { color: '#D1D5DB' } },
      axisLabel: { color: '#6B7280', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: 'm',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#6B7280', fontSize: 10 },
      splitLine: { lineStyle: { color: '#F3F4F6' } }
    },
    series: [{
      type: 'line',
      data: [1.2, 1.5, 2.1, 2.8, 3.5, 4.2, 4.8, 5.2, 4.6, 3.8, 2.9, 2.1],
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      itemStyle: { color: '#FF9500' },
      lineStyle: { width: 2, color: '#FF9500' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255, 149, 0, 0.35)' },
          { offset: 1, color: 'rgba(255, 149, 0, 0.02)' }
        ])
      }
    }]
  }), [])

  const subsidenceTableData = [
    { district: '城东区', station: 'CD-001', cumulative: 45.2, annual: 8.5, rate: '缓慢' },
    { district: '城西区', station: 'CX-003', cumulative: 32.8, annual: 5.2, rate: '缓慢' },
    { district: '城南区', station: 'CN-007', cumulative: 68.5, annual: 15.8, rate: '较快' },
    { district: '城北区', station: 'CB-002', cumulative: 28.3, annual: 3.6, rate: '平稳' },
    { district: '高新区', station: 'GX-012', cumulative: 89.6, annual: 22.4, rate: '较快' },
    { district: '经开区', station: 'JK-005', cumulative: 52.1, annual: 10.3, rate: '缓慢' }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#00B8D9]" />
            报告参数配置
          </h2>
          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">步骤 1/2</span>
        </div>

        <div className="p-5 space-y-5 max-h-[calc(100vh-380px)] overflow-y-auto">
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              年度地下水监测通报生成
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">报告年份</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}年</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">报告季度</label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
              >
                {QUARTERS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">涵盖区域</label>
            <div className="flex flex-wrap gap-2">
              {DISTRICTS.map(d => {
                const selected = selectedDistricts.includes(d)
                return (
                  <button
                    key={d}
                    onClick={() => toggleDistrict(d)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                      selected
                        ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm shadow-cyan-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                    )}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">包含章节</label>
            <div className="grid grid-cols-3 gap-2">
              {CHAPTERS.map(c => {
                const checked = selectedChapters.includes(c.id)
                return (
                  <label key={c.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleChapter(c.id)}
                      className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-xs text-gray-700">{c.name}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                高级选项
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showAdvanced && (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCharts}
                      onChange={(e) => setIncludeCharts(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">包含图表</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeRawData}
                      onChange={(e) => setIncludeRawData(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">包含原始数据</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">模板选择</label>
                  <div className="flex gap-2">
                    {TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setTemplate(t.id)}
                        className={cn(
                          'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                          template === t.id
                            ? 'bg-gradient-to-r from-[#0A2540] to-[#2A6DB8] text-white border-transparent shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        )}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#0A2540] to-[#2A6DB8] rounded-lg hover:shadow-lg transition-all">
              <Sparkles className="w-4 h-4" />
              自动生成
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#0A2540] bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-all">
              <Eye className="w-4 h-4" />
              预览模板
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-inner overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">报告实时预览</span>
            <span className="text-xs text-gray-400">（A4 仿真）</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">缩放: 70%</span>
          </div>
        </div>

        <div className="relative mx-auto" style={{ width: '595px', height: '842px', transform: 'scale(0.78)', transformOrigin: 'top center' }}>
          <div
            className="absolute inset-0 bg-white shadow-2xl rounded-sm"
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}
          >
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
              <div className="transform -rotate-30 text-8xl font-bold text-gray-100 whitespace-nowrap select-none opacity-40">
                仅供内部参考
              </div>
            </div>

            <div className="p-10 h-full flex flex-col relative z-10">
              <div className="text-center border-b-2 border-[#0A2540] pb-4 mb-6">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A2540] to-[#2A6DB8] flex items-center justify-center text-white">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-[#0A2540]">市水务局</div>
                    <div className="text-xs text-gray-500">地下水监测中心</div>
                  </div>
                </div>
                <h1 className="text-xl font-bold text-[#0A2540] tracking-wide">
                  {year}年度{quarter !== '全年' ? quarter + '度' : ''}地下水监测通报
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedDistricts.join('、')} · 编制日期：{TODAY}
                </p>
              </div>

              <div className="flex-1 overflow-hidden space-y-4 text-sm">
                {selectedChapters.includes('overview') && (
                  <section>
                    <h2 className="text-base font-bold text-[#0A2540] mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-[#00B8D9] to-[#0A2540] rounded-full" />
                      一、概述
                    </h2>
                    <p className="text-gray-700 leading-relaxed text-xs pl-3">
                      本报告汇总{year}{quarter !== '全年' ? '年' + quarter : '年度'}全市地下水监测数据，覆盖{selectedDistricts.length}个行政区
                      共{monitoringWells.length}口监测井。监测期间数据采集总体稳定，数据通过率达96.8%。
                      全市地下水水位总体保持稳定，部分区域受季节性开采影响出现小幅波动。
                      水质状况总体良好，Ⅲ类及以上水质占比82.5%。地面沉降总体可控，高新区、城南区沉降速率需关注。
                    </p>
                  </section>
                )}

                {selectedChapters.includes('waterLevel') && includeCharts && (
                  <section>
                    <h2 className="text-base font-bold text-[#0A2540] mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-[#00B8D9] to-[#0A2540] rounded-full" />
                      二、水位状况
                    </h2>
                    <div className="pl-3">
                      <p className="text-xs text-gray-700 mb-2">
                        {year}年全市平均水位埋深27.8m，较上年上升0.3m。丰水期（6-9月）水位较高，枯水期（12-2月）水位相对较低。
                      </p>
                      <div className="h-40 border border-gray-100 rounded-lg bg-gray-50/30 p-2">
                        <ReactECharts option={waterLevelChartOption} style={{ height: '100%', width: '100%' }} notMerge />
                      </div>
                    </div>
                  </section>
                )}

                {selectedChapters.includes('drawdown') && includeCharts && (
                  <section>
                    <h2 className="text-base font-bold text-[#0A2540] mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-[#00B8D9] to-[#0A2540] rounded-full" />
                      三、降深趋势
                    </h2>
                    <div className="pl-3">
                      <p className="text-xs text-gray-700 mb-2">
                        年度最大降深5.2m（8月），最小降深1.2m（1月）。高新区降深幅度最大，城北区最小。
                      </p>
                      <div className="h-36 border border-gray-100 rounded-lg bg-gray-50/30 p-2">
                        <ReactECharts option={drawdownChartOption} style={{ height: '100%', width: '100%' }} notMerge />
                      </div>
                    </div>
                  </section>
                )}

                {selectedChapters.includes('subsidence') && (
                  <section>
                    <h2 className="text-base font-bold text-[#0A2540] mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-[#00B8D9] to-[#0A2540] rounded-full" />
                      四、地面沉降
                    </h2>
                    <div className="pl-3">
                      <p className="text-xs text-gray-700 mb-2">
                        各监测站点沉降数据统计如下：
                      </p>
                      <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-2 py-1.5 text-left font-semibold text-gray-700">区域</th>
                            <th className="px-2 py-1.5 text-left font-semibold text-gray-700">站点</th>
                            <th className="px-2 py-1.5 text-right font-semibold text-gray-700">累计(mm)</th>
                            <th className="px-2 py-1.5 text-right font-semibold text-gray-700">年沉降(mm)</th>
                            <th className="px-2 py-1.5 text-center font-semibold text-gray-700">速率</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subsidenceTableData.map((row, i) => (
                            <tr key={row.station} className={cn(i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white', 'border-t border-gray-100')}>
                              <td className="px-2 py-1.5 text-gray-700">{row.district}</td>
                              <td className="px-2 py-1.5 font-mono text-gray-600">{row.station}</td>
                              <td className="px-2 py-1.5 text-right font-mono text-gray-700">{row.cumulative}</td>
                              <td className={cn('px-2 py-1.5 text-right font-mono font-semibold',
                                row.annual > 15 ? 'text-red-600' : row.annual > 10 ? 'text-amber-600' : 'text-gray-700')}>
                                {row.annual}
                              </td>
                              <td className={cn('px-2 py-1.5 text-center text-xs font-medium',
                                row.rate === '较快' ? 'text-red-600' : row.rate === '缓慢' ? 'text-amber-600' : 'text-green-600')}>
                                {row.rate}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">报告日期：</span>
                    <span className="text-gray-700 font-medium">{TODAY}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">编制人：</span>
                    <span className="text-gray-700 font-medium">张海涛</span>
                  </div>
                  <div>
                    <span className="text-gray-500">审核人：</span>
                    <span className="text-gray-700 font-medium">王建国</span>
                  </div>
                  <div>
                    <span className="text-gray-500">批准人：</span>
                    <span className="text-gray-700 font-medium">李明远</span>
                  </div>
                </div>
                <div className="text-center text-[10px] text-gray-400 mt-3">
                  — 第 1 页 / 共 12 页 —
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute right-8 bottom-8 z-20">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 bg-gradient-to-r from-[#0A2540] to-[#2A6DB8] text-white text-xs font-medium flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              导出报告
            </div>
            <div className="p-2 space-y-1">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-red-50 rounded-lg transition-colors">
                <FileText className="w-4 h-4 text-red-500" />
                PDF格式
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-green-50 rounded-lg transition-colors">
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Excel格式
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 rounded-lg transition-colors">
                <FileJson className="w-4 h-4 text-blue-500" />
                Word格式
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <Printer className="w-4 h-4 text-gray-500" />
                打印
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomReportTab() {
  const [reportName, setReportName] = useState('季度水位水质综合分析报告')
  const [reportDesc, setReportDesc] = useState('分析2025年Q2各区域水位埋深、水质指标变化趋势')
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['waterDepth', 'waterTemp', 'ph'])
  const [startDate, setStartDate] = useState('2026-01-01')
  const [endDate, setEndDate] = useState('2026-06-18')
  const [granularity, setGranularity] = useState('月')
  const [selectedWells, setSelectedWells] = useState<string[]>(['JCJ-001', 'JCJ-003', 'JCJ-007'])
  const [chartType, setChartType] = useState('line')
  const [colorScheme, setColorScheme] = useState('default')
  const [sortOrder, setSortOrder] = useState('default')

  const toggleIndicator = (id: string) => {
    setSelectedIndicators(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const toggleWell = (id: string) => {
    setSelectedWells(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const colors = COLOR_SCHEMES.find(c => c.id === colorScheme)?.colors || COLOR_SCHEMES[0].colors

  const previewChartOption = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月']
    const series = selectedIndicators.map((indId, idx) => {
      const ind = CUSTOM_INDICATORS.find(i => i.id === indId)
      const baseData = {
        waterDepth: [22.5, 23.1, 24.8, 26.2, 28.5, 30.1],
        waterTemp: [14.2, 14.8, 16.5, 19.2, 22.1, 23.8],
        ph: [7.2, 7.3, 7.4, 7.2, 7.1, 7.2],
        tds: [450, 462, 478, 485, 492, 488],
        hardness: [280, 285, 292, 298, 305, 302],
        conductivity: [580, 592, 610, 625, 638, 632],
        warningCount: [3, 1, 2, 5, 4, 2]
      } as Record<string, number[]>
      return {
        name: ind?.name || indId,
        type: chartType === 'area' ? 'line' : chartType,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: colors[idx % colors.length] },
        lineStyle: { width: 2.5, color: colors[idx % colors.length] },
        areaStyle: chartType === 'area' ? {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors[idx % colors.length] + '66' },
            { offset: 1, color: colors[idx % colors.length] + '05' }
          ])
        } : undefined,
        barWidth: '40%',
        data: baseData[indId] || Array(6).fill(0).map(() => Math.round(Math.random() * 100))
      }
    })

    const baseOption: Record<string, unknown> = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { top: 0, textStyle: { fontSize: 12, color: '#6B7280' } },
      grid: { left: '5%', right: '5%', top: '14%', bottom: '12%', containLabel: true }
    }

    if (chartType === 'pie') {
      return {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 0, textStyle: { fontSize: 12, color: '#6B7280' } },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, color: '#4B5563' },
          data: selectedIndicators.map((indId, idx) => {
            const ind = CUSTOM_INDICATORS.find(i => i.id === indId)
            return {
              name: ind?.name || indId,
              value: 50 + Math.round(Math.random() * 100),
              itemStyle: { color: colors[idx % colors.length] }
            }
          })
        }]
      }
    }

    if (chartType === 'radar') {
      return {
        tooltip: {},
        legend: { top: 0, textStyle: { fontSize: 12, color: '#6B7280' } },
        radar: {
          indicator: selectedIndicators.map(indId => {
            const ind = CUSTOM_INDICATORS.find(i => i.id === indId)
            return { name: ind?.name || indId, max: 100 }
          }),
          radius: '65%',
          axisName: { color: '#4B5563', fontSize: 11 },
          splitLine: { lineStyle: { color: '#E5E7EB' } },
          splitArea: { areaStyle: { color: ['#FAFAFA', '#F3F4F6'] } }
        },
        series: [{
          type: 'radar',
          data: selectedWells.slice(0, 3).map((wellId, wIdx) => ({
            name: wellId,
            value: selectedIndicators.map(() => 30 + Math.round(Math.random() * 60)),
            itemStyle: { color: colors[wIdx % colors.length] },
            areaStyle: { color: colors[wIdx % colors.length] + '33' },
            lineStyle: { width: 2 }
          }))
        }]
      }
    }

    return {
      ...baseOption,
      xAxis: {
        type: 'category',
        data: months,
        boundaryGap: chartType === 'bar',
        axisLine: { lineStyle: { color: '#D1D5DB' } },
        axisLabel: { color: '#6B7280', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#6B7280', fontSize: 11 },
        splitLine: { lineStyle: { color: '#F3F4F6' } }
      },
      series: series
    }
  }, [selectedIndicators, chartType, colorScheme, colors, selectedWells])

  const previewTableData = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月']
    return months.map((m, idx) => {
      const row: Record<string, unknown> = { month: m }
      selectedIndicators.forEach(indId => {
        const baseData = {
          waterDepth: [22.5, 23.1, 24.8, 26.2, 28.5, 30.1],
          waterTemp: [14.2, 14.8, 16.5, 19.2, 22.1, 23.8],
          ph: [7.2, 7.3, 7.4, 7.2, 7.1, 7.2],
          tds: [450, 462, 478, 485, 492, 488],
          hardness: [280, 285, 292, 298, 305, 302],
          warningCount: [3, 1, 2, 5, 4, 2]
        } as Record<string, number[]>
        row[indId] = baseData[indId]?.[idx] || (10 + Math.random() * 100).toFixed(2)
      })
      return row
    })
  }, [selectedIndicators])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#00B8D9]" />
            报表配置
          </h2>
          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">自定义任意维度分析报表</span>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">报表名称</label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">报表说明</label>
              <input
                type="text"
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              指标选择
              <span className="text-xs text-gray-400 ml-2">（已选 {selectedIndicators.length} 个）</span>
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
              {CUSTOM_INDICATORS.map(ind => {
                const Icon = ind.icon
                const selected = selectedIndicators.includes(ind.id)
                return (
                  <button
                    key={ind.id}
                    onClick={() => toggleIndicator(ind.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                      selected
                        ? 'bg-gradient-to-r from-[#0A2540] to-[#2A6DB8] text-white border-transparent shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300 hover:text-cyan-700'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {ind.name}
                    {ind.unit && <span className="opacity-70 text-[10px]">({ind.unit})</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> 开始日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> 结束日期
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">统计粒度</label>
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
              >
                {GRANULARITIES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> 井点选择
              </label>
              <div className="relative">
                <select
                  multiple
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white h-[38px] overflow-hidden"
                >
                  {monitoringWells.slice(0, 5).map(w => (
                    <option key={w.wellId} value={w.wellId} className={selectedWells.includes(w.wellId) ? 'bg-cyan-50' : ''}>
                      {w.wellId}
                    </option>
                  ))}
                </select>
                <span className="absolute right-2 top-2 text-xs text-gray-400">{selectedWells.length}口</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">快速选择井点</label>
            <div className="flex flex-wrap gap-1.5">
              {monitoringWells.slice(0, 12).map(w => {
                const selected = selectedWells.includes(w.wellId)
                return (
                  <button
                    key={w.wellId}
                    onClick={() => toggleWell(w.wellId)}
                    className={cn(
                      'px-2 py-1 rounded-md text-[11px] font-mono transition-all border',
                      selected
                        ? 'bg-cyan-100 text-cyan-700 border-cyan-300'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    )}
                  >
                    {w.wellId}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">图表类型</label>
              <div className="grid grid-cols-3 gap-1.5">
                {CHART_TYPES.map(ct => {
                  const Icon = ct.icon
                  const active = chartType === ct.id
                  return (
                    <button
                      key={ct.id}
                      onClick={() => setChartType(ct.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-all border',
                        active
                          ? 'bg-cyan-50 border-cyan-300 text-cyan-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {ct.name}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" /> 配色方案
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {COLOR_SCHEMES.map(cs => (
                  <button
                    key={cs.id}
                    onClick={() => setColorScheme(cs.id)}
                    className={cn(
                      'p-2 rounded-lg transition-all border flex items-center gap-2',
                      colorScheme === cs.id
                        ? 'border-cyan-400 ring-2 ring-cyan-200 bg-cyan-50/30'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                  >
                    <div className="flex gap-0.5">
                      {cs.colors.slice(0, 4).map((c, i) => (
                        <div key={i} className="w-3 h-5 rounded-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-600 whitespace-nowrap">{cs.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> 排序方式
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
              >
                {SORT_ORDERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#00B8D9]" />
            实时预览
            <span className="text-xs font-normal text-gray-400 ml-1">· 配置变化后自动更新</span>
          </h2>
        </div>

        <div className="p-5 space-y-5">
          {chartType !== 'table' ? (
            <div className="h-80 border border-gray-100 rounded-xl bg-gray-50/30 p-4">
              <ReactECharts option={previewChartOption} style={{ height: '100%', width: '100%' }} notMerge />
            </div>
          ) : null}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <TableIcon className="w-4 h-4 text-gray-500" /> 数据明细
              </h3>
              <span className="text-xs text-gray-400">{previewTableData.length} 条记录</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">月份</th>
                    {selectedIndicators.map(indId => {
                      const ind = CUSTOM_INDICATORS.find(i => i.id === indId)
                      return (
                        <th key={indId} className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">
                          {ind?.name || indId}{ind?.unit ? `(${ind.unit})` : ''}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewTableData.map((row, i) => (
                    <tr key={i} className={cn(i % 2 === 1 ? 'bg-gray-50/30' : 'bg-white', 'hover:bg-cyan-50/30 transition-colors')}>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{row.month as string}</td>
                      {selectedIndicators.map(indId => (
                        <td key={indId} className="px-4 py-2.5 text-right font-mono text-gray-700">
                          {typeof row[indId] === 'number' ? (row[indId] as number).toFixed(2) : String(row[indId])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-end gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <Save className="w-4 h-4" />
            保存配置
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0A2540] bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-all">
            <FileBarChart className="w-4 h-4" />
            生成报表
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#0A2540] to-[#2A6DB8] rounded-lg hover:shadow-lg transition-all">
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>
      </div>
    </div>
  )
}

function HistoryQueryTab() {
  const [dataType, setDataType] = useState('waterLevel')
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([])
  const [selectedWells, setSelectedWells] = useState<string[]>([])
  const [quickRange, setQuickRange] = useState('30d')
  const [startDate, setStartDate] = useState(addDays(TODAY, -30))
  const [endDate, setEndDate] = useState(TODAY)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [abnormalOnly, setAbnormalOnly] = useState(false)
  const [tablePage, setTablePage] = useState(1)
  const [searchKeyword, setSearchKeyword] = useState('')
  const PAGE_SIZE = 10

  const toggleDistrict = (d: string) => {
    setSelectedDistricts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }
  const toggleWell = (id: string) => {
    setSelectedWells(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const applyQuickRange = (rangeId: string, days: number) => {
    setQuickRange(rangeId)
    if (days > 0) {
      setStartDate(addDays(TODAY, -days))
      setEndDate(TODAY)
    }
  }

  const wellMap = useMemo(() => {
    const m: Record<string, typeof monitoringWells[0]> = {}
    monitoringWells.forEach(w => { m[w.wellId] = w })
    return m
  }, [])

  const filteredRecords = useMemo(() => {
    let records = waterLevelRecords.filter(r => {
      const t = r.collectionTime.slice(0, 10)
      if (t < startDate || t > endDate) return false
      if (selectedDistricts.length > 0) {
        const well = wellMap[r.wellId]
        if (!well || !selectedDistricts.includes(well.district)) return false
      }
      if (selectedWells.length > 0 && !selectedWells.includes(r.wellId)) return false
      if (abnormalOnly && !r.isAbnormal) return false
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase()
        const well = wellMap[r.wellId]
        if (!r.wellId.toLowerCase().includes(kw) && !well?.wellName.toLowerCase().includes(kw)) return false
      }
      if (minValue && r.waterDepth < parseFloat(minValue)) return false
      if (maxValue && r.waterDepth > parseFloat(maxValue)) return false
      return true
    })
    records = [...records].sort((a, b) => new Date(b.collectionTime).getTime() - new Date(a.collectionTime).getTime())
    return records
  }, [startDate, endDate, selectedDistricts, selectedWells, abnormalOnly, searchKeyword, minValue, maxValue, wellMap])

  const summary = useMemo(() => {
    const total = filteredRecords.length
    if (total === 0) return { total: 0, avg: 0, max: 0, min: 0, anomalies: 0 }
    const values = filteredRecords.map(r => r.waterDepth)
    return {
      total,
      avg: values.reduce((s, v) => s + v, 0) / total,
      max: Math.max(...values),
      min: Math.min(...values),
      anomalies: filteredRecords.filter(r => r.isAbnormal).length
    }
  }, [filteredRecords])

  const totalPages = Math.ceil(filteredRecords.length / PAGE_SIZE)
  const pagedRecords = filteredRecords.slice((tablePage - 1) * PAGE_SIZE, tablePage * PAGE_SIZE)

  const trendChartOption = useMemo(() => {
    const daysMap: Record<string, number[]> = {}
    filteredRecords.forEach(r => {
      const day = r.collectionTime.slice(5, 10)
      if (!daysMap[day]) daysMap[day] = []
      daysMap[day].push(r.waterDepth)
    })
    const days = Object.keys(daysMap).sort().slice(0, 30)
    const avgValues = days.map(d => {
      const arr = daysMap[d]
      return arr.length > 0 ? parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2)) : 0
    })
    const maxValues = days.map(d => parseFloat(Math.max(...daysMap[d]).toFixed(2)))
    const minValues = days.map(d => parseFloat(Math.min(...daysMap[d]).toFixed(2)))

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { top: 0, textStyle: { fontSize: 11, color: '#6B7280' }, data: ['均值', '最大值', '最小值'] },
      grid: { left: '5%', right: '5%', top: '14%', bottom: '14%', containLabel: true },
      xAxis: {
        type: 'category',
        data: days,
        axisLine: { lineStyle: { color: '#D1D5DB' } },
        axisLabel: { color: '#6B7280', fontSize: 10, rotate: 45 }
      },
      yAxis: {
        type: 'value',
        name: 'm',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#6B7280', fontSize: 10 },
        splitLine: { lineStyle: { color: '#F3F4F6' } }
      },
      series: [
        {
          name: '均值',
          type: 'line',
          data: avgValues,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          itemStyle: { color: '#00B8D9' },
          lineStyle: { width: 2.5 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 184, 217, 0.4)' },
              { offset: 1, color: 'rgba(0, 184, 217, 0.02)' }
            ])
          }
        },
        {
          name: '最大值',
          type: 'line',
          data: maxValues,
          smooth: true,
          symbol: 'none',
          itemStyle: { color: '#FF9500' },
          lineStyle: { width: 1.5, type: 'dashed' }
        },
        {
          name: '最小值',
          type: 'line',
          data: minValues,
          smooth: true,
          symbol: 'none',
          itemStyle: { color: '#34C759' },
          lineStyle: { width: 1.5, type: 'dashed' }
        }
      ]
    }
  }, [filteredRecords])

  const resetFilters = () => {
    setDataType('waterLevel')
    setSelectedDistricts([])
    setSelectedWells([])
    applyQuickRange('30d', 30)
    setMinValue('')
    setMaxValue('')
    setStatusFilter('全部')
    setAbnormalOnly(false)
    setSearchKeyword('')
    setTablePage(1)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#00B8D9]" />
            筛选条件
          </h2>
          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">多条件组合查询历史数据</span>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">数据类型</label>
            <div className="flex flex-wrap gap-2">
              {HISTORY_DATA_TYPES.map(dt => (
                <button
                  key={dt.id}
                  onClick={() => setDataType(dt.id)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                    dataType === dt.id
                      ? 'bg-gradient-to-r from-[#0A2540] to-[#2A6DB8] text-white border-transparent shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300'
                  )}
                >
                  {dt.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">区域选择</label>
              <div className="flex flex-wrap gap-1.5">
                {DISTRICTS.map(d => {
                  const selected = selectedDistricts.includes(d)
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDistrict(d)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                        selected
                          ? 'bg-cyan-500 text-white border-cyan-500'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      )}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">井点选择</label>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {monitoringWells.slice(0, 20).map(w => {
                  const selected = selectedWells.includes(w.wellId)
                  return (
                    <button
                      key={w.wellId}
                      onClick={() => toggleWell(w.wellId)}
                      className={cn(
                        'px-2 py-1 rounded-md text-[11px] font-mono transition-all border',
                        selected
                          ? 'bg-cyan-100 text-cyan-700 border-cyan-300'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      )}
                    >
                      {w.wellId}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">时间范围</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_RANGES.map(qr => (
                <button
                  key={qr.id}
                  onClick={() => applyQuickRange(qr.id, qr.days)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    quickRange === qr.id
                      ? 'bg-cyan-50 border-cyan-400 text-cyan-700 ring-2 ring-cyan-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  )}
                >
                  {qr.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setQuickRange('custom') }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setQuickRange('custom') }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-500" />
                高级筛选
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showAdvanced && (
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">数值最小值</label>
                  <input
                    type="number"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    placeholder="m"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">数值最大值</label>
                  <input
                    type="number"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    placeholder="m"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">质控状态</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  >
                    <option value="全部">全部</option>
                    <option value="合格">合格</option>
                    <option value="待复核">待复核</option>
                    <option value="缺失补全">缺失补全</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-1.5">
                    <input
                      type="checkbox"
                      checked={abnormalOnly}
                      onChange={(e) => setAbnormalOnly(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">仅显示异常</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索井号/井名..."
                value={searchKeyword}
                onChange={(e) => { setSearchKeyword(e.target.value); setTablePage(1) }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
              />
            </div>
            <button
              onClick={() => setTablePage(1)}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#0A2540] to-[#2A6DB8] rounded-lg hover:shadow-lg transition-all"
            >
              <Search className="w-4 h-4" />
              查询
            </button>
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-2">
        <StatCard title="数据总数" value={summary.total.toLocaleString()} unit="条" icon={FileBarChart} color="primary" />
        <StatCard title="均值" value={summary.avg.toFixed(2)} unit="m" icon={GaugeIcon} color="secondary" />
        <StatCard title="最大值" value={summary.max.toFixed(2)} unit="m" icon={TrendingUp} color="danger" />
        <StatCard title="最小值" value={summary.min.toFixed(2)} unit="m" icon={TrendingDown} color="success" />
        <StatCard title="异常数" value={summary.anomalies} unit="条" icon={AlertTriangle} color="warning" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#00B8D9]" />
            查询结果
            <span className="text-xs font-normal text-gray-400 ml-1">· 共 {filteredRecords.length.toLocaleString()} 条</span>
          </h2>
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
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">质控</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedRecords.map((r, i) => {
                const well = wellMap[r.wellId]
                return (
                  <tr
                    key={r.recordId}
                    className={cn(
                      i % 2 === 1 ? 'bg-gray-50/30' : 'bg-white',
                      'hover:bg-cyan-50/40 transition-colors',
                      r.isAbnormal && 'ring-2 ring-inset ring-red-300/60 bg-red-50/30'
                    )}
                  >
                    <td className="px-4 py-3 text-gray-600 text-xs font-mono whitespace-nowrap">{r.collectionTime.slice(0, 16)}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#0A2540]">{r.wellId}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate" title={well?.wellName}>{well?.wellName || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{well?.district || '-'}</td>
                    <td className={cn(
                      'px-4 py-3 text-right font-mono font-semibold',
                      r.waterDepth > 45 ? 'text-red-600' : r.waterDepth > 30 ? 'text-amber-600' : 'text-gray-800'
                    )}>
                      {r.waterDepth.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{r.waterTemperature.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{r.conductivity.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
                        r.qualityFlag === '合格'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : r.qualityFlag === '待复核'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                      )}>
                        {r.qualityFlag}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.isAbnormal ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {pagedRecords.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <span>暂无匹配的记录</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-500 bg-gray-50/30">
          <span>第 <span className="font-semibold text-gray-700">{tablePage}</span> / {totalPages || 1} 页 · 显示 {pagedRecords.length} 条</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTablePage(p => Math.max(1, p - 1))}
              disabled={tablePage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
            >
              <ChevronLeft className="w-4 h-4" /> 上一页
            </button>
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-[#00B8D9]" />
            趋势分析
          </h2>
        </div>
        <div className="p-5">
          <div className="h-72">
            <ReactECharts option={trendChartOption} style={{ height: '100%', width: '100%' }} notMerge />
          </div>
        </div>
        <div className="absolute right-5 bottom-5">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#228B22] to-[#34C759] rounded-lg hover:shadow-lg transition-all shadow-md">
            <Download className="w-4 h-4" />
            批量导出CSV
          </button>
        </div>
      </div>
    </div>
  )
}

function MaintenanceReportTab() {
  const wellMap = useMemo(() => {
    const m: Record<string, typeof monitoringWells[0]> = {}
    monitoringWells.forEach(w => { m[w.wellId] = w })
    return m
  }, [])

  const maintenanceTypePieOption = useMemo(() => {
    const counts: Record<string, number> = { '日常巡检': 0, '传感器校准': 0, '设备维修': 0, '水泵更换': 0 }
    maintenanceRecords.forEach(r => { counts[r.maintenanceType]++ })
    const colors = ['#3B82F6', '#34C759', '#FF9500', '#EF4444']
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 11, color: '#6B7280' } },
      series: [{
        type: 'pie',
        radius: ['40%', '68%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
        label: { show: true, formatter: '{b}\n{c}次', fontSize: 11, color: '#4B5563' },
        labelLine: { length: 12, length2: 8 },
        data: Object.entries(counts).map(([name, value], i) => ({
          name, value, itemStyle: { color: colors[i] }
        }))
      }]
    }
  }, [])

  const completionRateOption = useMemo(() => {
    const total = maintenanceRecords.length
    const completed = maintenanceRecords.filter(r => r.result.includes('完成') || r.result.includes('正常') || r.result.includes('合格') || r.result.includes('通过') || r.result.includes('交付')).length
    const completionRate = total > 0 ? Math.round(completed / total * 100) : 0
    return {
      tooltip: { trigger: 'item', formatter: '完成率: {d}%' },
      series: [{
        type: 'pie',
        radius: ['55%', '78%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: {
          show: true,
          position: 'center',
          formatter: [`{a|${completionRate}%}`, '{b|完成率}'].join('\n'),
          rich: {
            a: { fontSize: 32, fontWeight: 'bold', color: '#0A2540', lineHeight: 40 },
            b: { fontSize: 13, color: '#6B7280', lineHeight: 20 }
          }
        },
        labelLine: { show: false },
        data: [
          { value: completionRate, name: '已完成', itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#22C55E' }, { offset: 1, color: '#34D399' }]) } },
          { value: 100 - completionRate, name: '未完成', itemStyle: { color: '#E5E7EB' } }
        ]
      }]
    }
  }, [])

  const monthlyBarOption = useMemo(() => {
    const monthMap: Record<string, { 日常巡检: number, 传感器校准: number, 设备维修: number, 水泵更换: number }> = {}
    const months: string[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date('2026-06-01')
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${d.getMonth() + 1}月`
      months.push(label)
      monthMap[label] = { '日常巡检': 0, '传感器校准': 0, '设备维修': 0, '水泵更换': 0 }
      maintenanceRecords.forEach(r => {
        if (r.maintenanceDate.startsWith(key)) {
          monthMap[label][r.maintenanceType]++
        }
      })
    }
    const types = ['日常巡检', '传感器校准', '设备维修', '水泵更换']
    const colors = ['#3B82F6', '#34C759', '#FF9500', '#EF4444']
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, textStyle: { fontSize: 11, color: '#6B7280' } },
      grid: { left: '5%', right: '5%', top: '18%', bottom: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { lineStyle: { color: '#D1D5DB' } },
        axisLabel: { color: '#6B7280', fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        name: '次数',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#6B7280', fontSize: 10 },
        splitLine: { lineStyle: { color: '#F3F4F6' } },
        nameTextStyle: { color: '#6B7280', fontSize: 10 }
      },
      series: types.map((t, i) => ({
        name: t,
        type: 'bar',
        stack: 'total',
        emphasis: { focus: 'series' },
        itemStyle: { color: colors[i], borderRadius: i === types.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0] },
        barWidth: '55%',
        data: months.map(m => monthMap[m]?.[t as keyof typeof monthMap[string]] || 0)
      }))
    }
  }, [])

  const dueReminders = useMemo(() => [
    { wellId: 'JCJ-015', wellName: '高新区新港监测井015号', type: '传感器校准', dueDate: '2026-06-22', daysLeft: 4, urgency: 'urgent' },
    { wellId: 'JCJ-023', wellName: '城南区雨花台监测井023号', type: '日常巡检', dueDate: '2026-06-24', daysLeft: 6, urgency: 'normal' },
    { wellId: 'JCJ-008', wellName: '城西区龙江监测井008号', type: '水泵更换', dueDate: '2026-06-25', daysLeft: 7, urgency: 'normal' },
    { wellId: 'JCJ-031', wellName: '经开区江宁经开监测井031号', type: '设备维修', dueDate: '2026-06-28', daysLeft: 10, urgency: 'normal' },
    { wellId: 'JCJ-042', wellName: '城北区浦口监测井042号', type: '传感器校准', dueDate: '2026-07-02', daysLeft: 14, urgency: 'low' }
  ], [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-[#00B8D9]" />
              维护类型统计
            </h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">共 {maintenanceRecords.length} 次</span>
          </div>
          <div className="p-5">
            <div className="h-72">
              <ReactECharts option={maintenanceTypePieOption} style={{ height: '100%', width: '100%' }} notMerge />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#00B8D9]" />
              维护完成率
            </h2>
          </div>
          <div className="p-5">
            <div className="h-72">
              <ReactECharts option={completionRateOption} style={{ height: '100%', width: '100%' }} notMerge />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#00B8D9]" />
              维护记录
            </h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">最近 {Math.min(10, maintenanceRecords.length)} 条</span>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">日期</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">井号</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">类型</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">内容</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">人员</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">结果</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {maintenanceRecords.slice(0, 10).map((r, i) => {
                  const typeColors: Record<string, string> = {
                    '日常巡检': 'bg-blue-50 text-blue-700 border-blue-200',
                    '传感器校准': 'bg-green-50 text-green-700 border-green-200',
                    '设备维修': 'bg-orange-50 text-orange-700 border-orange-200',
                    '水泵更换': 'bg-red-50 text-red-700 border-red-200'
                  }
                  return (
                    <tr key={r.recordId} className={cn(i % 2 === 1 ? 'bg-gray-50/30' : 'bg-white', 'hover:bg-cyan-50/40 transition-colors')}>
                      <td className="px-4 py-3 text-gray-600 text-xs font-mono whitespace-nowrap">{r.maintenanceDate}</td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#0A2540]">{r.wellId}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border', typeColors[r.maintenanceType])}>
                          {r.maintenanceType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs max-w-[200px] truncate" title={r.content}>{r.content}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {r.maintenancePerson}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs max-w-[150px] truncate" title={r.result}>{r.result}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#00B8D9]" />
              月度维护统计
            </h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">近12个月</span>
          </div>
          <div className="p-5">
            <div className="h-80">
              <ReactECharts option={monthlyBarOption} style={{ height: '100%', width: '100%' }} notMerge />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              到期提醒
            </h2>
            <p className="text-xs text-gray-400 mt-1 ml-7">以下监测井即将到达计划维护日期，请及时安排</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] rounded-lg hover:shadow-lg transition-all shadow-md">
            <Download className="w-4 h-4" />
            导出维护工单
          </button>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {dueReminders.map((item, i) => {
              const urgencyConfig = {
                urgent: { bg: 'from-red-50 to-orange-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, iconColor: 'text-red-500' },
                normal: { bg: 'from-amber-50 to-yellow-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, iconColor: 'text-amber-500' },
                low: { bg: 'from-blue-50 to-cyan-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700 border-blue-200', icon: Calendar, iconColor: 'text-blue-500' }
              }[item.urgency]
              const UrgencyIcon = urgencyConfig.icon
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r transition-all hover:shadow-md',
                    urgencyConfig.bg, urgencyConfig.border
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-white/70 shadow-sm', urgencyConfig.iconColor)}>
                      <UrgencyIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-[#0A2540]">{item.wellId}</span>
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border', urgencyConfig.badge)}>
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{item.wellName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 mb-1 justify-end">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-700">{item.dueDate}</span>
                    </div>
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                      item.daysLeft <= 5
                        ? 'bg-red-500 text-white shadow-sm'
                        : item.daysLeft <= 10
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-blue-500 text-white shadow-sm'
                    )}>
                      {item.daysLeft <= 5 && <AlertCircle className="w-3 h-3" />}
                      还剩 {item.daysLeft} 天
                    </span>
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
