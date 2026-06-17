import React, { useMemo, useState } from 'react'
import { Activity, Droplets, AlertTriangle, MapPin, Search, ChevronRight, TrendingUp, Filter } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts/core'
import { ScatterChart, PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  VisualMapComponent,
  GraphicComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { monitoringWells } from '@/data/wells'
import { waterLevelRecords } from '@/data/waterLevel'
import { warningEvents } from '@/data/warnings'
import { cn } from '@/lib/utils'

echarts.use([
  ScatterChart,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  VisualMapComponent,
  GraphicComponent,
  CanvasRenderer
])

// 状态颜色映射
const STATUS_COLORS: Record<string, string> = {
  在线: '#34C759',
  离线: '#9CA3AF',
  维护: '#FF9500',
  预警: '#FF3B30'
}

// 状态背景色映射
const STATUS_BG_COLORS: Record<string, string> = {
  在线: 'bg-green-100 text-green-700 border-green-200',
  离线: 'bg-gray-100 text-gray-700 border-gray-200',
  维护: 'bg-orange-100 text-orange-700 border-orange-200',
  预警: 'bg-red-100 text-red-700 border-red-200'
}

// 区域列表
const DISTRICTS = ['全部', '城东区', '城西区', '城南区', '城北区', '高新区', '经开区']
const STATUS_FILTERS = ['全部', '在线', '离线', '维护', '预警']

// ============== StatCard 组件 ==============
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  color?: 'default' | 'success' | 'warning' | 'danger'
}

function StatCard({ title, value, icon, trend, trendUp, color = 'default' }: StatCardProps) {
  const colorClasses = {
    default: 'bg-blue-50 text-blue-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-orange-50 text-orange-600',
    danger: 'bg-red-50 text-red-600'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm',
              trendUp ? 'text-green-600' : 'text-red-600'
            )}>
              <TrendingUp className={cn('w-4 h-4', !trendUp && 'rotate-180')} />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', colorClasses[color])}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function MonitoringNetwork() {
  // 当前区域筛选（GIS图）
  const [currentDistrict, setCurrentDistrict] = useState('全部')
  // 列表筛选状态
  const [listStatusFilter, setListStatusFilter] = useState('全部')
  const [listDistrictFilter, setListDistrictFilter] = useState('全部')
  const [searchKeyword, setSearchKeyword] = useState('')

  // 计算每个井的最新水位记录
  const latestWaterLevels = useMemo(() => {
    const map: Record<string, { waterDepth: number; collectionTime: string }> = {}
    waterLevelRecords.forEach(record => {
      const existing = map[record.wellId]
      if (!existing || new Date(record.collectionTime) > new Date(existing.collectionTime)) {
        map[record.wellId] = {
          waterDepth: record.waterDepth,
          collectionTime: record.collectionTime
        }
      }
    })
    return map
  }, [])

  // 检查是否有未解决预警
  const wellHasActiveWarning = useMemo(() => {
    const set = new Set<string>()
    warningEvents
      .filter(w => w.status !== '已解决')
      .forEach(w => set.add(w.wellId))
    return set
  }, [])

  // 获取井点的实际显示状态（有未解决预警则显示预警）
  const getWellDisplayStatus = (well: typeof monitoringWells[0]) => {
    if (wellHasActiveWarning.has(well.wellId)) return '预警'
    return well.status
  }

  // 统计数据
  const totalWells = monitoringWells.length
  const onlineCount = monitoringWells.filter(w => getWellDisplayStatus(w) === '在线').length
  const offlineMaintenanceCount = monitoringWells.filter(
    w => getWellDisplayStatus(w) === '离线' || getWellDisplayStatus(w) === '维护'
  ).length
  const warningCount = warningEvents.filter(w => w.status !== '已解决').length

  // 按区域筛选的井点（GIS图）
  const filteredWellsForMap = useMemo(() => {
    if (currentDistrict === '全部') return monitoringWells
    return monitoringWells.filter(w => w.district === currentDistrict)
  }, [currentDistrict])

  // 筛选列表井点
  const filteredWellsForList = useMemo(() => {
    return monitoringWells.filter(w => {
      const status = getWellDisplayStatus(w)
      if (listStatusFilter !== '全部' && status !== listStatusFilter) return false
      if (listDistrictFilter !== '全部' && w.district !== listDistrictFilter) return false
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase()
        return (
          w.wellId.toLowerCase().includes(keyword) ||
          w.wellName.toLowerCase().includes(keyword) ||
          w.district.includes(keyword)
        )
      }
      return true
    }).slice(0, 10)
  }, [listStatusFilter, listDistrictFilter, searchKeyword, wellHasActiveWarning])

  // ============== GIS散点图配置 ==============
  const gisChartOption = useMemo(() => {
    // 按状态分组的散点数据
    const seriesData: Record<string, Array<[number, number, number, string, string, string, string, number]>> = {
      在线: [],
      离线: [],
      维护: [],
      预警: []
    }

    filteredWellsForMap.forEach(well => {
      const status = getWellDisplayStatus(well)
      const waterLevel = latestWaterLevels[well.wellId]?.waterDepth ?? well.baselineWaterLevel
      seriesData[status].push([
        well.longitude,
        well.latitude,
        well.wellDepth,
        well.wellId,
        well.wellName,
        well.district,
        status,
        waterLevel
      ])
    })

    const series = Object.entries(seriesData).map(([status, data]) => ({
      name: status,
      type: 'scatter' as const,
      data: data,
      symbolSize: (val: number[]) => {
        const depth = val[2]
        return Math.max(8, Math.min(20, depth / 25))
      },
      itemStyle: {
        color: STATUS_COLORS[status],
        shadowBlur: 10,
        shadowColor: STATUS_COLORS[status],
        opacity: 0.9
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 20,
          shadowColor: STATUS_COLORS[status],
          borderColor: '#fff',
          borderWidth: 2
        }
      }
    }))

    // 添加涟漪背景效果
    const rippleEffect = {
      name: '等深线涟漪',
      type: 'effectScatter' as const,
      coordinateSystem: 'cartesian2d' as const,
      rippleEffect: {
        brushType: 'stroke' as const,
        scale: 4,
        period: 4
      },
      data: filteredWellsForMap.slice(0, 8).map(well => ([
        well.longitude,
        well.latitude,
        well.wellDepth
      ])),
      symbolSize: 30,
      itemStyle: {
        color: 'rgba(59, 130, 246, 0.15)'
      },
      z: 0
    }

    return {
      backgroundColor: {
        type: 'radial',
        x: 0.5,
        y: 0.5,
        r: 0.8,
        colorStops: [
          { offset: 0, color: '#E0F2FE' },
          { offset: 0.5, color: '#BAE6FD' },
          { offset: 1, color: '#7DD3FC' }
        ]
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: '#374151'
        },
        formatter: (params: any) => {
          if (params.seriesName === '等深线涟漪') return ''
          const data = params.data
          return `
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #111827;">
              ${data[4]}
            </div>
            <div style="font-size: 12px; line-height: 1.8;">
              <div>井编号: <span style="font-weight: 500;">${data[3]}</span></div>
              <div>所属区域: <span style="font-weight: 500;">${data[5]}</span></div>
              <div>运行状态: <span style="font-weight: 500; color: ${STATUS_COLORS[data[6]]};">● ${data[6]}</span></div>
              <div>当前水位: <span style="font-weight: 500;">${data[7].toFixed(2)} m</span></div>
              <div>井深: <span style="font-weight: 500;">${data[2]} m</span></div>
            </div>
          `
        }
      },
      legend: {
        show: true,
        left: 20,
        top: 20,
        orient: 'vertical' as const,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: [12, 16],
        borderRadius: 8,
        textStyle: {
          color: '#374151',
          fontSize: 12
        },
        itemGap: 12
      },
      grid: {
        left: '5%',
        right: '5%',
        top: '10%',
        bottom: '10%'
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
      graphic: [
        {
          type: 'text',
          right: 20,
          bottom: 60,
          style: {
            text: '数据范围:',
            fontSize: 12,
            fill: '#374151',
            fontWeight: 500
          }
        }
      ],
      series: [rippleEffect, ...series]
    }
  }, [filteredWellsForMap, latestWaterLevels, wellHasActiveWarning])

  // ============== 饼图配置（含水层类型分布） ==============
  const pieChartOption = useMemo(() => {
    const typeCount: Record<string, number> = {}
    monitoringWells.forEach(w => {
      typeCount[w.aquiferType] = (typeCount[w.aquiferType] || 0) + 1
    })

    const data = Object.entries(typeCount).map(([name, value]) => ({ name, value }))
    const colors = ['#3B82F6', '#10B981', '#8B5CF6']

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}口 ({d}%)'
      },
      legend: {
        bottom: 0,
        left: 'center',
        orient: 'horizontal' as const,
        textStyle: {
          color: '#6B7280',
          fontSize: 12
        },
        itemGap: 20
      },
      series: [
        {
          name: '井点类型分布',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside' as const,
            formatter: '{b}\n{c}口',
            fontSize: 11,
            color: '#4B5563'
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 8
          },
          data: data.map((d, i) => ({
            ...d,
            itemStyle: { color: colors[i % colors.length] }
          }))
        }
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '40%',
          style: {
            text: totalWells.toString(),
            fontSize: 28,
            fontWeight: 'bold',
            fill: '#1F2937',
            textAlign: 'center'
          }
        },
        {
          type: 'text',
          left: 'center',
          top: '50%',
          style: {
            text: '井点总数',
            fontSize: 12,
            fill: '#6B7280',
            textAlign: 'center'
          }
        }
      ]
    }
  }, [totalWells])

  // ============== 柱状图配置（区域井点分布） ==============
  const barChartOption = useMemo(() => {
    const districtCount: Record<string, number> = {}
    monitoringWells.forEach(w => {
      districtCount[w.district] = (districtCount[w.district] || 0) + 1
    })

    const sorted = Object.entries(districtCount).sort((a, b) => b[1] - a[1])
    const categories = sorted.map(([name]) => name)
    const values = sorted.map(([, value]) => value)

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow' as const
        },
        formatter: (params: any) => {
          const p = params[0]
          return `${p.name}: ${p.value}口井`
        }
      },
      grid: {
        left: '3%',
        right: '10%',
        bottom: '8%',
        top: '5%',
        containLabel: true
      },
      xAxis: {
        type: 'value' as const,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#6B7280',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: '#F3F4F6',
            type: 'dashed' as const
          }
        }
      },
      yAxis: {
        type: 'category' as const,
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#374151',
          fontSize: 12,
          fontWeight: 500
        }
      },
      series: [
        {
          type: 'bar',
          data: values.map((value, index) => ({
            value,
            itemStyle: {
              borderRadius: [0, 6, 6, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: ['#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#FB923C', '#F87171'][index] },
                { offset: 1, color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#EF4444'][index] }
              ])
            }
          })),
          barWidth: 16,
          label: {
            show: true,
            position: 'right' as const,
            formatter: '{c}',
            color: '#4B5563',
            fontSize: 12,
            fontWeight: 600
          }
        }
      ]
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6">
      {/* ============== 页面标题区 ============== */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <MapPin className="w-8 h-8 text-blue-600" />
          监测井网总览
        </h1>
        <p className="text-gray-500 text-base ml-11">全市监测井点实时状态监控</p>
      </div>

      {/* ============== 顶部统计卡区域 ============== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="总井点数量"
          value={totalWells}
          icon={<Droplets className="w-6 h-6" />}
          color="default"
        />
        <StatCard
          title="在线监测"
          value={onlineCount}
          icon={<Activity className="w-6 h-6" />}
          trend="+1.2%"
          trendUp
          color="success"
        />
        <StatCard
          title="离线/维护"
          value={offlineMaintenanceCount}
          icon={<Filter className="w-6 h-6" />}
          color="warning"
        />
        <StatCard
          title="预警中"
          value={warningCount}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="danger"
        />
      </div>

      {/* ============== 主体部分（左右布局） ============== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* 左区 - 监测井分布图 */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">监测井分布GIS图</h2>
              <div className="flex gap-2">
                {DISTRICTS.map(district => (
                  <button
                    key={district}
                    onClick={() => setCurrentDistrict(district)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                      currentDistrict === district
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {district}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 p-4">
              <ReactECharts
                option={gisChartOption}
                style={{ height: '480px', width: '100%' }}
                notMerge
                lazyUpdate
              />
            </div>
          </div>
        </div>

        {/* 右区 - 井点列表 */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">监测井点清单</h2>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                查看全部
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* 筛选区域 */}
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">状态</label>
                  <select
                    value={listStatusFilter}
                    onChange={(e) => setListStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {STATUS_FILTERS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">区域</label>
                  <select
                    value={listDistrictFilter}
                    onChange={(e) => setListDistrictFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索井编号/井名..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 表格 */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">井编号</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">井名称</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">区域</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">含水层</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">水位(m)</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredWellsForList.map((well, idx) => {
                    const status = getWellDisplayStatus(well)
                    const waterDepth = latestWaterLevels[well.wellId]?.waterDepth ?? well.baselineWaterLevel
                    return (
                      <tr key={well.wellId} className={cn(
                        idx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white',
                        'hover:bg-blue-50/50 transition-colors'
                      )}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">{well.wellId}</td>
                        <td className="px-4 py-3 text-gray-800 truncate max-w-[140px]" title={well.wellName}>
                          {well.wellName}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{well.district}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                            STATUS_BG_COLORS[status]
                          )}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{well.aquiferType}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700 font-medium">
                          {waterDepth.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-blue-600 hover:text-blue-700 text-xs font-medium hover:underline">
                            查看详情
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredWellsForList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        暂无匹配的井点数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页样式 */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>共 {filteredWellsForList.length} 条 / 总计 {monitoringWells.length}</span>
              <div className="flex gap-1">
                <button className="px-3 py-1 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>
                  上一页
                </button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded">
                  1
                </button>
                <button className="px-3 py-1 border border-gray-200 rounded text-gray-600 hover:bg-gray-50">
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============== 底部区域 ============== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左 - 井点类型分布饼图 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">井点类型分布</h2>
          <ReactECharts
            option={pieChartOption}
            style={{ height: '320px', width: '100%' }}
            notMerge
          />
        </div>

        {/* 右 - 区域井点分布柱状图 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">区域井点分布</h2>
          <ReactECharts
            option={barChartOption}
            style={{ height: '320px', width: '100%' }}
            notMerge
          />
        </div>
      </div>
    </div>
  )
}
