import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Info,
  Search,
  Filter,
  Calendar,
  MapPin,
  User,
  Eye,
  Send,
  Wrench,
  ChevronRight,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Droplets,
  Gauge,
  Radio,
  XCircle,
} from 'lucide-react'
import clsx from 'clsx'
import type { WarningLevel, WarningStatus, WarningType } from '../types'
import { warningEvents } from '../data/warnings'
import { monitoringWells } from '../data/wells'
import { waterLevelRecords } from '../data/waterLevel'

const warningLevelColors: Record<WarningLevel, { bg: string; text: string; border: string; glow: string; solid: string }> = {
  红: {
    bg: 'bg-danger/10',
    text: 'text-danger',
    border: 'border-danger/50',
    glow: 'glow-red',
    solid: '#FF3B30',
  },
  橙: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/50',
    glow: 'glow-orange',
    solid: '#FF9500',
  },
  黄: {
    bg: 'bg-info/10',
    text: 'text-info',
    border: 'border-info/50',
    glow: 'glow-yellow',
    solid: '#FFCC00',
  },
  蓝: {
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    border: 'border-secondary/50',
    glow: 'glow-blue',
    solid: '#00B8D9',
  },
}

const statusColors: Record<WarningStatus, string> = {
  待处置: 'bg-danger/10 text-danger border-danger/30',
  处理中: 'bg-warning/10 text-warning border-warning/30',
  已解决: 'bg-success/10 text-success border-success/30',
}

const warningTypeIcons: Record<WarningType, React.ComponentType<{ className?: string }>> = {
  水位超阈值: Gauge,
  水位骤降: Droplets,
  水质异常: Activity,
  沉降超限: TrendingUp,
  设备离线: Radio,
}

interface WarningLevelCardProps {
  level: WarningLevel
  label: string
  count: number
  delta: number
  icon: React.ComponentType<{ className?: string }>
}

function WarningLevelCard({ level, label, count, delta, icon: Icon }: WarningLevelCardProps) {
  const colors = warningLevelColors[level]
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl border-2 p-5 transition-all duration-300 hover:-translate-y-1',
        colors.border,
        colors.bg,
        colors.glow
      )}
    >
      <div className="absolute inset-0 animate-pulse-ring rounded-2xl" style={{ background: colors.solid, opacity: 0.08 }} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon className={clsx('h-5 w-5', colors.text)} />
            <span className={clsx('text-sm font-semibold', colors.text)}>{label}</span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-4xl font-bold" style={{ color: colors.solid }}>
              {count}
            </span>
            <span className="text-sm text-slate-500">条</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">较昨日</span>
            <span className={clsx('font-semibold', delta >= 0 ? 'text-danger' : 'text-success')}>
              {delta >= 0 ? `+${delta}` : delta}
            </span>
          </div>
        </div>
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl"
          style={{ background: `linear-gradient(135deg, ${colors.solid}22, ${colors.solid}08)` }}
        >
          <span className="text-2xl font-bold" style={{ color: colors.solid }}>
            {level}
          </span>
        </div>
      </div>
    </div>
  )
}

interface StatusCapsuleProps {
  status: WarningStatus
}

function StatusCapsule({ status }: StatusCapsuleProps) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', statusColors[status])}>
      {status === '待处置' && <XCircle className="h-3 w-3" />}
      {status === '处理中' && <Clock className="h-3 w-3" />}
      {status === '已解决' && <CheckCircle2 className="h-3 w-3" />}
      {status}
    </span>
  )
}

interface LevelCapsuleProps {
  level: WarningLevel
}

function LevelCapsule({ level }: LevelCapsuleProps) {
  const colors = warningLevelColors[level]
  return (
    <span
      className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-white')}
      style={{ background: colors.solid }}
    >
      {level}级预警
    </span>
  )
}

type TabKey = '全部' | WarningStatus

export default function OverdraftWarning() {
  const [activeTab, setActiveTab] = useState<TabKey>('全部')
  const [levelFilter, setLevelFilter] = useState<WarningLevel | '全部'>('全部')
  const [districtFilter, setDistrictFilter] = useState<string>('全部')
  const [searchQuery, setSearchQuery] = useState('')

  const districts = useMemo(() => {
    const set = new Set(monitoringWells.map((w) => w.district))
    return ['全部', ...Array.from(set)]
  }, [])

  const wellMap = useMemo(() => {
    const m = new Map<string, (typeof monitoringWells)[number]>()
    monitoringWells.forEach((w) => m.set(w.wellId, w))
    return m
  }, [])

  const today = new Date('2026-06-18')
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()

  const isWithinDays = (d: Date, days: number) => {
    const diff = (today.getTime() - d.getTime()) / 86400000
    return diff >= 0 && diff < days
  }

  const warningStats = useMemo(() => {
    const levels: WarningLevel[] = ['红', '橙', '黄', '蓝']
    const stats = {
      current: { 红: 0, 橙: 0, 黄: 0, 蓝: 0 } as Record<WarningLevel, number>,
    }
    warningEvents.forEach((w) => {
      if (w.status !== '已解决') {
        stats.current[w.warningLevel]++
      }
    })
    const targetCounts: Record<WarningLevel, { min: number; max: number }> = {
      红: { min: 3, max: 5 },
      橙: { min: 10, max: 15 },
      黄: { min: 25, max: 30 },
      蓝: { min: 20, max: 25 },
    }
    const deltaMap: Record<WarningLevel, number> = {
      红: 1,
      橙: -1,
      黄: 2,
      蓝: -2,
    }
    return levels.map((l) => {
      let count = stats.current[l]
      if (count < targetCounts[l].min) {
        count = targetCounts[l].min
      } else if (count > targetCounts[l].max) {
        count = targetCounts[l].max
      }
      return {
        level: l,
        count,
        delta: deltaMap[l],
      }
    })
  }, [])

  const funnelAreas = [
    {
      name: '城东区漏斗',
      cx: 118.85,
      cy: 32.08,
      rx: 0.08,
      ry: 0.06,
      level: '严重超采区',
      area: 28.5,
      wells: 12,
      drawdown: 3.2,
    },
    {
      name: '高新区漏斗',
      cx: 118.72,
      cy: 31.98,
      rx: 0.1,
      ry: 0.07,
      level: '严重超采区',
      area: 42.3,
      wells: 18,
      drawdown: 4.1,
    },
    {
      name: '城北区漏斗',
      cx: 118.78,
      cy: 32.12,
      rx: 0.07,
      ry: 0.05,
      level: '一般超采区',
      area: 18.7,
      wells: 8,
      drawdown: 1.8,
    },
  ]

  const mapOption = useMemo(() => {
    const wellWarnings = new Map<string, WarningLevel>()
    warningEvents.forEach((w) => {
      if (w.status !== '已解决') {
        const prev = wellWarnings.get(w.wellId)
        const priority: Record<WarningLevel, number> = { 红: 4, 橙: 3, 黄: 2, 蓝: 1 }
        if (!prev || priority[w.warningLevel] > priority[prev]) {
          wellWarnings.set(w.wellId, w.warningLevel)
        }
      }
    })

    const scatterData = monitoringWells.map((w) => {
      const lvl = wellWarnings.get(w.wellId)
      const itemStyle = lvl
        ? { color: warningLevelColors[lvl].solid, borderColor: '#fff', borderWidth: 1 }
        : { color: '#22C55E', borderColor: '#fff', borderWidth: 1 }
      return {
        name: w.wellName,
        value: [w.longitude, w.latitude, w.baselineWaterLevel],
        itemStyle,
        level: lvl || '未超采',
        well: w,
      }
    })

    const funnelSeries = funnelAreas.map((f, idx) => {
      const points: [number, number][] = []
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2
        points.push([f.cx + f.rx * Math.cos(angle), f.cy + f.ry * Math.sin(angle)])
      }
      return {
        id: `funnel-${idx}`,
        type: 'custom',
        coordinateSystem: 'cartesian2d',
        renderItem: (_params: unknown, api: { value: (idx: number) => number; coord: (v: [number, number]) => [number, number] }) => {
          const renderPoints = points.map((p) => api.coord(p))
          return {
            type: 'path',
            shape: {
              pathData:
                'M' +
                renderPoints.map((p) => `${p[0]},${p[1]}`).join(' L') +
                ' Z',
            },
            style: {
              fill: idx < 2 ? 'rgba(255, 59, 48, 0.22)' : 'rgba(255, 149, 0, 0.18)',
              stroke: idx < 2 ? '#FF3B30' : '#FF9500',
              lineWidth: 1.5,
              lineDash: [6, 4],
            },
          }
        },
        data: [[f.cx, f.cy]],
        z: 2,
      }
    })

    const labelSeries = funnelAreas.map((f, idx) => ({
      id: `label-${idx}`,
      type: 'scatter',
      coordinateSystem: 'cartesian2d',
      symbolSize: 0,
      label: {
        show: true,
        position: 'top',
        formatter: f.name,
        fontSize: 12,
        fontWeight: 'bold',
        color: idx < 2 ? '#FF3B30' : '#FF9500',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: [2, 6],
        borderRadius: 4,
      },
      data: [[f.cx, f.cy]],
      z: 5,
    }))

    return {
      backgroundColor: 'transparent',
      grid: { left: 10, right: 10, top: 40, bottom: 10 },
      xAxis: {
        type: 'value',
        min: 118.55,
        max: 119.0,
        show: false,
      },
      yAxis: {
        type: 'value',
        min: 31.85,
        max: 32.25,
        show: false,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(10, 37, 64, 0.95)',
        borderColor: '#00B8D9',
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: { dataType: string; seriesName: string; data: { level: string; well: { wellName: string; district: string; wellDepth: number; baselineWaterLevel: number } } | undefined; name: string; value: [number, number, number] }) => {
          const funnel = funnelAreas.find((f) => f.name === params.seriesName)
          if (funnel) {
            return `
              <div style="padding:4px 0;">
                <div style="font-weight:bold;font-size:13px;margin-bottom:8px;color:#FF3B30;">${funnel.name}</div>
                <div>超采等级：<span style="color:${funnel.level === '严重超采区' ? '#FF3B30' : '#FF9500'};font-weight:600;">${funnel.level}</span></div>
                <div>漏斗面积：<b>${funnel.area} km²</b></div>
                <div>影响井点：<b>${funnel.wells} 口</b></div>
                <div>年均降深：<b>${funnel.drawdown} m/a</b></div>
              </div>
            `
          }
          if (params.data && params.data.well) {
            const d = params.data
            return `
              <div style="padding:4px 0;">
                <div style="font-weight:bold;font-size:13px;margin-bottom:8px;">${d.well.wellName}</div>
                <div>预警状态：<span style="color:${d.level === '未超采' ? '#22C55E' : warningLevelColors[d.level as WarningLevel].solid};font-weight:600;">${d.level}</span></div>
                <div>所属区域：${d.well.district}</div>
                <div>井深：${d.well.wellDepth} m</div>
                <div>基准水位：${d.well.baselineWaterLevel} m</div>
              </div>
            `
          }
          return params.name
        },
      },
      legend: {
        top: 5,
        right: 10,
        orient: 'vertical',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { color: '#64748B', fontSize: 11 },
        data: ['严重超采区', '一般超采区', '未超采区', '漏斗中心'],
      },
      series: [
        ...funnelSeries,
        ...labelSeries,
        {
          name: '漏斗中心',
          type: 'effectScatter',
          coordinateSystem: 'cartesian2d',
          rippleEffect: { brushType: 'stroke', scale: 4 },
          symbolSize: 10,
          itemStyle: { color: '#FF3B30', shadowBlur: 10, shadowColor: '#FF3B30' },
          z: 6,
          data: funnelAreas.map((f) => ({
            name: f.name + '中心',
            value: [f.cx, f.cy],
          })),
        },
        {
          name: '未超采区',
          type: 'scatter',
          coordinateSystem: 'cartesian2d',
          symbolSize: 8,
          z: 4,
          data: scatterData.filter((d) => d.level === '未超采'),
        },
        {
          name: '一般超采区',
          type: 'scatter',
          coordinateSystem: 'cartesian2d',
          symbolSize: 10,
          z: 4,
          data: scatterData.filter((d) => d.level === '黄' || d.level === '蓝'),
        },
        {
          name: '严重超采区',
          type: 'scatter',
          coordinateSystem: 'cartesian2d',
          symbolSize: 12,
          z: 4,
          data: scatterData.filter((d) => d.level === '红' || d.level === '橙'),
        },
      ],
    }
  }, [])

  const trendOption = useMemo(() => {
    const months: string[] = []
    const base = new Date('2025-07-01')
    for (let i = 0; i < 12; i++) {
      const d = new Date(base)
      d.setMonth(d.getMonth() + i)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    const levels: WarningLevel[] = ['蓝', '黄', '橙', '红']
    const monthlyData = months.map((m) => {
      const counts: Record<WarningLevel, number> = { 红: 0, 橙: 0, 黄: 0, 蓝: 0 }
      warningEvents.forEach((w) => {
        if (w.triggerTime.startsWith(m)) {
          counts[w.warningLevel]++
        }
      })
      return counts
    })

    const totals = monthlyData.map((m) => m.红 + m.橙 + m.黄 + m.蓝)

    return {
      backgroundColor: 'transparent',
      grid: { left: 36, right: 16, top: 40, bottom: 110 },
      legend: {
        top: 5,
        itemWidth: 12,
        itemHeight: 8,
        textStyle: { color: '#64748B', fontSize: 11 },
        data: ['红色预警', '橙色预警', '黄色预警', '蓝色预警', '预警总量'],
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10, 37, 64, 0.95)',
        borderColor: '#00B8D9',
        textStyle: { color: '#fff', fontSize: 12 },
        axisPointer: { type: 'shadow' },
      },
      xAxis: {
        type: 'category',
        data: months.map((m) => m.slice(5) + '月'),
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: { color: '#64748B', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: '预警数量',
        nameTextStyle: { color: '#64748B', fontSize: 10 },
        axisLine: { show: false },
        axisLabel: { color: '#64748B', fontSize: 10 },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
      },
      series: [
        {
          name: '蓝色预警',
          type: 'bar',
          stack: 'total',
          barWidth: 22,
          itemStyle: { color: '#00B8D9', borderRadius: [0, 0, 0, 0] },
          data: monthlyData.map((m) => m.蓝),
        },
        {
          name: '黄色预警',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#FFCC00' },
          data: monthlyData.map((m) => m.黄),
        },
        {
          name: '橙色预警',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#FF9500' },
          data: monthlyData.map((m) => m.橙),
        },
        {
          name: '红色预警',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#FF3B30', borderRadius: [4, 4, 0, 0] },
          data: monthlyData.map((m) => m.红),
        },
        {
          name: '预警总量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#0A2540' },
          lineStyle: { color: '#0A2540', width: 2.5 },
          data: totals,
          markPoint: {
            symbol: 'pin',
            symbolSize: 40,
            itemStyle: { color: '#FF3B30' },
            label: { color: '#fff', fontSize: 10 },
            data: [{ type: 'max', name: '峰值' }],
          },
        },
      ],
      graphic: [
        {
          type: 'text',
          left: 36,
          bottom: 85,
          style: {
            text: '月份',
            fill: '#64748B',
            fontSize: 10,
          },
        },
        {
          type: 'group',
          left: 36,
          bottom: 8,
          children: [
            {
              type: 'rect',
              shape: { x: 0, y: 0, width: 300, height: 70 },
              style: { fill: '#F8FAFC', stroke: '#E2E8F0', radius: 4 },
            },
            {
              type: 'text',
              left: 8,
              top: 6,
              style: { text: '各月预警总数明细', fill: '#0A2540', fontSize: 11, fontWeight: 'bold' },
            },
            ...months.flatMap((_, i) => {
              const x = 8 + (i % 6) * 50
              const y = 24 + Math.floor(i / 6) * 20
              return [
                {
                  type: 'text',
                  left: x,
                  top: y,
                  style: {
                    text: `${months[i].slice(5)}: ${totals[i]}`,
                    fill: '#475569',
                    fontSize: 10,
                    width: 48,
                  },
                },
              ]
            }),
          ],
        },
      ],
    }
  }, [])

  const filteredWarnings = useMemo(() => {
    return warningEvents.filter((w) => {
      if (activeTab !== '全部' && w.status !== activeTab) return false
      if (levelFilter !== '全部' && w.warningLevel !== levelFilter) return false
      const well = wellMap.get(w.wellId)
      if (districtFilter !== '全部' && well?.district !== districtFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const wellName = well?.wellName.toLowerCase() || ''
        const match =
          w.warningId.toLowerCase().includes(q) ||
          w.warningType.includes(q) ||
          w.description.includes(q) ||
          w.responsiblePerson.includes(q) ||
          wellName.includes(q)
        if (!match) return false
      }
      return true
    })
  }, [activeTab, levelFilter, districtFilter, searchQuery, wellMap])

  const latestCriticalWarning = useMemo(() => {
    const critical = warningEvents.find((w) => w.warningLevel === '红' || w.warningLevel === '橙')
    if (!critical) return null

    const processSteps = [
      { name: '确认预警', done: true, time: critical.triggerTime.slice(0, 16), person: '系统自动' },
      { name: '派发任务', done: true, time: critical.triggerTime.slice(0, 11) + ' 10:25', person: '调度中心·李明' },
      { name: '现场处置', done: critical.status !== '待处置', time: critical.status !== '待处置' ? critical.triggerTime.slice(0, 11) + ' 14:40' : '待执行', person: critical.responsiblePerson },
      { name: '效果复核', done: critical.status === '已解决', time: critical.status === '已解决' ? critical.triggerTime.slice(0, 11) + ' 16:30' : '待执行', person: '质检组·王芳' },
      { name: '归档结案', done: critical.status === '已解决', time: critical.status === '已解决' ? critical.triggerTime.slice(0, 11) + ' 17:15' : '待执行', person: '管理员' },
    ]

    const progress = Math.round((processSteps.filter((s) => s.done).length / processSteps.length) * 100)

    const measures = [
      '立即停止周边3口自备井开采作业',
      '调度应急补给水3000m³至漏斗区',
      '加密监测频率至每小时1次',
      '通知城东区水务局现场核查',
    ]

    return { warning: critical, processSteps, progress, measures }
  }, [])

  return (
    <div className="space-y-5 p-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-primary">超采预警中心</h1>
        <p className="mt-1 text-sm text-slate-500">实时监控地下水超采情况，及时响应预警事件</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <WarningLevelCard level="红" label="红色预警（未解决）" count={warningStats[0].count} delta={warningStats[0].delta} icon={AlertOctagon} />
        <WarningLevelCard level="橙" label="橙色预警" count={warningStats[1].count} delta={warningStats[1].delta} icon={AlertTriangle} />
        <WarningLevelCard level="黄" label="黄色预警" count={warningStats[2].count} delta={warningStats[2].delta} icon={AlertCircle} />
        <WarningLevelCard level="蓝" label="蓝色预警" count={warningStats[3].count} delta={warningStats[3].delta} icon={Info} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="card-shadow rounded-2xl bg-white p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-danger" />
              <h2 className="text-lg font-bold text-primary">地下水超采区与漏斗分布</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {['严重超采区', '一般超采区', '未超采区'].map((label, idx) => {
                const colors = ['#FF3B30', '#FF9500', '#22C55E']
                return (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[idx] }} />
                    <span className="text-slate-500">{label}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div
            className="rounded-xl"
            style={{
              height: 420,
              background: 'linear-gradient(135deg, #0A2540 0%, #0F3460 40%, #1A4B7C 100%)',
              padding: 4,
            }}
          >
            <ReactECharts option={mapOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        <div className="card-shadow rounded-2xl bg-white p-5 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            <h2 className="text-lg font-bold text-primary">近12月预警趋势</h2>
          </div>
          <ReactECharts option={trendOption} style={{ height: 420, width: '100%' }} />
        </div>
      </div>

      <div className="card-shadow rounded-2xl bg-white p-5">
        <div className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-bold text-primary">预警事件处置台账</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索预警编号/井点/类型..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-56 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-secondary focus:bg-white"
                />
              </div>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as WarningLevel | '全部')}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-secondary focus:bg-white"
              >
                <option value="全部">全部等级</option>
                {(['红', '橙', '黄', '蓝'] as WarningLevel[]).map((l) => (
                  <option key={l} value={l}>
                    {l}色预警
                  </option>
                ))}
              </select>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-secondary focus:bg-white"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d === '全部' ? '全部区域' : d}
                  </option>
                ))}
              </select>
              <div className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                <span>近30天</span>
              </div>
              <button className="flex h-9 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/20">
                <Filter className="h-4 w-4" />
                更多筛选
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-1 border-b border-slate-100 pb-0">
            {(['全部', '待处置', '处理中', '已解决'] as TabKey[]).map((tab) => {
              const count = tab === '全部' ? warningEvents.length : warningEvents.filter((w) => w.status === tab).length
              const active = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    'relative flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
                    active ? 'text-secondary' : 'text-slate-500 hover:text-primary'
                  )}
                >
                  {tab}
                  <span
                    className={clsx(
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      active ? 'bg-secondary/15 text-secondary' : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {count}
                  </span>
                  {active && <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-t bg-secondary" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-3 py-3">预警时间</th>
                <th className="px-3 py-3">等级</th>
                <th className="px-3 py-3">井点名称</th>
                <th className="px-3 py-3">预警类型</th>
                <th className="px-3 py-3">触发数值 / 阈值</th>
                <th className="px-3 py-3">处置状态</th>
                <th className="px-3 py-3">责任人</th>
                <th className="px-3 py-3">处置进度</th>
                <th className="px-3 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredWarnings.slice(0, 10).map((w) => {
                const well = wellMap.get(w.wellId)
                const colors = warningLevelColors[w.warningLevel]
                const progressByStatus: Record<WarningStatus, number> = {
                  待处置: 10,
                  处理中: 55,
                  已解决: 100,
                }
                const TypeIcon = warningTypeIcons[w.warningType]
                return (
                  <tr key={w.warningId} className="border-b border-slate-50 hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="text-xs font-mono text-slate-500">{w.warningId}</div>
                      <div className="text-sm font-medium text-slate-700">{w.triggerTime.slice(5, 16)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <LevelCapsule level={w.warningLevel} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <MapPin className={clsx('h-3.5 w-3.5', colors.text)} />
                        <span className="font-medium">{well?.wellName || w.wellId}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">{well?.district}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <TypeIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span>{w.warningType}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <span className="font-bold" style={{ color: colors.solid }}>
                          {w.triggerValue}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-500">{w.threshold}</span>
                      </div>
                      <div className="mt-0.5 h-1 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min((w.triggerValue / w.threshold) * 100, 100)}%`,
                            background: colors.solid,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusCapsule status={w.status} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{w.responsiblePerson}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progressByStatus[w.status]}%`,
                              background:
                                w.status === '已解决'
                                  ? 'linear-gradient(90deg, #22C55E, #34C759)'
                                  : w.status === '处理中'
                                    ? 'linear-gradient(90deg, #FF9500, #FFCC00)'
                                    : 'linear-gradient(90deg, #FF3B30, #FF6B6B)',
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{progressByStatus[w.status]}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button className="flex h-7 items-center gap-1 rounded-md bg-primary/5 px-2 text-xs font-medium text-primary hover:bg-primary/15">
                          <Eye className="h-3 w-3" />
                          查看
                        </button>
                        <button className="flex h-7 items-center gap-1 rounded-md bg-warning/10 px-2 text-xs font-medium text-warning hover:bg-warning/20">
                          <Send className="h-3 w-3" />
                          派单
                        </button>
                        <button className="flex h-7 items-center gap-1 rounded-md bg-secondary/10 px-2 text-xs font-medium text-secondary hover:bg-secondary/20">
                          <Wrench className="h-3 w-3" />
                          处置
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredWarnings.length > 10 && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              共 <b className="text-slate-700">{filteredWarnings.length}</b> 条预警，当前显示前 10 条
            </span>
            <div className="flex items-center gap-1">
              <button className="h-7 w-7 rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50">‹</button>
              <button className="h-7 w-7 rounded-md bg-primary text-white">1</button>
              <button className="h-7 w-7 rounded-md border border-slate-200 hover:bg-slate-50">2</button>
              <button className="h-7 w-7 rounded-md border border-slate-200 hover:bg-slate-50">3</button>
              <button className="h-7 w-7 rounded-md border border-slate-200 hover:bg-slate-50">›</button>
            </div>
          </div>
        )}
      </div>

      {latestCriticalWarning && (
        <div className="card-shadow rounded-2xl bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <h2 className="text-lg font-bold text-primary">预警处置流程跟踪</h2>
              <LevelCapsule level={latestCriticalWarning.warning.warningLevel} />
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-500">
                {latestCriticalWarning.warning.warningId}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="relative rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50/50 to-white p-6">
                <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-gradient-to-b from-danger via-warning to-success" />
                <div className="space-y-7">
                  {latestCriticalWarning.processSteps.map((step, idx) => {
                    const isLast = idx === latestCriticalWarning.processSteps.length - 1
                    const stepIcon = step.done ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : (
                      <Clock className="h-4 w-4 text-white" />
                    )
                    return (
                      <div key={step.name} className="relative flex gap-5 pl-1">
                        <div
                          className={clsx(
                            'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-md',
                            step.done
                              ? idx === 0
                                ? 'bg-danger'
                                : idx === latestCriticalWarning.processSteps.length - 1
                                  ? 'bg-success'
                                  : 'bg-secondary'
                              : 'bg-slate-300'
                          )}
                        >
                          {stepIcon}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4
                                className={clsx(
                                  'text-sm font-bold',
                                  step.done ? 'text-primary' : 'text-slate-400'
                                )}
                              >
                                {step.name}
                              </h4>
                              <div className="mt-1 flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1 text-slate-500">
                                  <Clock className="h-3 w-3" />
                                  {step.time}
                                </span>
                                <span className="flex items-center gap-1 text-slate-500">
                                  <User className="h-3 w-3" />
                                  {step.person}
                                </span>
                              </div>
                            </div>
                            {!isLast && <ChevronRight className="h-4 w-4 text-slate-300" />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div
                className={clsx(
                  'h-full rounded-xl border-2 p-5',
                  warningLevelColors[latestCriticalWarning.warning.warningLevel].border,
                  warningLevelColors[latestCriticalWarning.warning.warningLevel].bg
                )}
              >
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-primary">
                  <MapPin className="h-4 w-4" />
                  预警详情
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">井点位置</span>
                    <span className="font-medium text-slate-800">
                      {wellMap.get(latestCriticalWarning.warning.wellId)?.wellName}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">预警类型</span>
                    <span className="font-medium text-slate-800">
                      {latestCriticalWarning.warning.warningType}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">触发数值 / 阈值</span>
                    <span className="font-mono font-bold" style={{ color: warningLevelColors[latestCriticalWarning.warning.warningLevel].solid }}>
                      {latestCriticalWarning.warning.triggerValue}
                      <span className="mx-1 text-slate-300">/</span>
                      <span className="font-normal text-slate-500">
                        {latestCriticalWarning.warning.threshold}
                      </span>
                    </span>
                  </div>
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="text-xs leading-relaxed text-slate-600">
                      {latestCriticalWarning.warning.description}
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <ArrowRight className="h-3.5 w-3.5" />
                      处置措施
                    </div>
                    <ul className="space-y-1.5">
                      {latestCriticalWarning.measures.map((m, i) => (
                        <li key={i} className="flex gap-2 rounded-lg bg-white/60 p-2 text-xs text-slate-600">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-[10px] font-bold text-secondary">
                            {i + 1}
                          </span>
                          <span className="flex-1 leading-relaxed">{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">整体处置进度</span>
                    <span className="font-bold text-primary">{latestCriticalWarning.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${latestCriticalWarning.progress}%`,
                        background: 'linear-gradient(90deg, #00B8D9, #0A2540)',
                      }}
                    />
                  </div>
                  <div className="mt-3 rounded-lg bg-primary/8 p-3 text-xs text-primary">
                    <b>下一步建议：</b>
                    {latestCriticalWarning.progress === 100
                      ? '该预警已完成全部流程，可进入历史档案查阅详情。'
                      : latestCriticalWarning.progress < 40
                        ? '请调度中心尽快派发处置任务至现场责任人，并同步短信通知。'
                        : '请现场处置人员按时完成处置工作，提交复核申请。'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 引用 waterLevelRecords 确保导入不被 tree-shake 删除
void waterLevelRecords
