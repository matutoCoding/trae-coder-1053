import type { WarningEvent, WarningLevel, WarningStatus, WarningType } from '../types'
import { monitoringWells } from './wells'

const responsiblePersons = [
  '张建国', '李晓明', '王海涛', '刘志强', '陈志刚',
  '赵玉梅', '孙丽娟', '周文斌', '吴晓峰', '郑梦琪',
  '冯伟东', '杨春燕', '何建平', '马慧敏', '黄旭东',
  '朱俊峰', '林国栋', '郭秀兰', '梁建华', '高文杰'
]

const warningDescriptions: Record<WarningType, string[]> = {
  水位超阈值: [
    '监测井水位埋深超过预设警戒阈值',
    '连续3日水位持续偏高，已突破预警线',
    '水位数据异常偏高，疑似周边抽水影响',
    '雨季汛期水位抬升超过安全阈值'
  ],
  水位骤降: [
    '24小时内水位下降超过2米，下降速率异常',
    '监测井水位突然骤降，疑似周边施工降水',
    '短时间内水位急剧下降，建议现场核查',
    '水位下降速率超过每日0.5米警戒值'
  ],
  水质异常: [
    'pH值超出正常范围(6.5-8.5)',
    'TDS指标超标，疑似周边污染源渗透',
    '总硬度超标，建议开展进一步水质检测',
    '氟化物浓度偏高，存在饮用水安全风险',
    '多项水质指标连续超标，需重点关注'
  ],
  沉降超限: [
    '本月沉降量超过月度警戒值(10mm)',
    '累计沉降量超过安全阈值，需启动应急预案',
    '沉降速率异常加快，疑似地下水超采',
    '连续三月沉降超标，建议开展地面巡查'
  ],
  设备离线: [
    '监测设备连续48小时无数据上传',
    '传感器通信中断，数据采集异常',
    '设备断电超过24小时，请尽快现场核查',
    '数据传输模块故障，远程重启无效'
  ]
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function formatDateTime(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(Math.floor(Math.random() * 24)).padStart(2, '0')
  const min = String(Math.floor(Math.random() * 60)).padStart(2, '0')
  const s = String(Math.floor(Math.random() * 60)).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

function generateWarnings(): WarningEvent[] {
  const warnings: WarningEvent[] = []

  const distribution: WarningLevel[] = [
    ...Array(5).fill('红'),
    ...Array(15).fill('橙'),
    ...Array(30).fill('黄'),
    ...Array(30).fill('蓝')
  ]

  const statuses: WarningStatus[] = ['待处置', '处理中', '已解决']
  const statusWeightsByLevel: Record<WarningLevel, WarningStatus[]> = {
    红: ['待处置', '待处置', '处理中', '已解决'],
    橙: ['待处置', '处理中', '处理中', '已解决', '已解决'],
    黄: ['待处置', '处理中', '已解决', '已解决', '已解决'],
    蓝: ['处理中', '已解决', '已解决', '已解决', '已解决']
  }

  const warningTypes: WarningType[] = ['水位超阈值', '水位骤降', '水质异常', '沉降超限', '设备离线']

  const thresholdsByLevel: Record<WarningLevel, Record<WarningType, { threshold: number; minTrigger: number; maxTrigger: number }>> = {
    红: {
      水位超阈值: { threshold: 45, minTrigger: 46, maxTrigger: 55 },
      水位骤降: { threshold: 3, minTrigger: 3.1, maxTrigger: 6 },
      水质异常: { threshold: 1.5, minTrigger: 1.51, maxTrigger: 2.5 },
      沉降超限: { threshold: 20, minTrigger: 21, maxTrigger: 35 },
      设备离线: { threshold: 120, minTrigger: 121, maxTrigger: 240 }
    },
    橙: {
      水位超阈值: { threshold: 40, minTrigger: 40.5, maxTrigger: 48 },
      水位骤降: { threshold: 2, minTrigger: 2.1, maxTrigger: 3.5 },
      水质异常: { threshold: 1.2, minTrigger: 1.21, maxTrigger: 1.8 },
      沉降超限: { threshold: 15, minTrigger: 15.5, maxTrigger: 25 },
      设备离线: { threshold: 72, minTrigger: 73, maxTrigger: 150 }
    },
    黄: {
      水位超阈值: { threshold: 35, minTrigger: 35.5, maxTrigger: 42 },
      水位骤降: { threshold: 1.5, minTrigger: 1.6, maxTrigger: 2.5 },
      水质异常: { threshold: 1.0, minTrigger: 1.01, maxTrigger: 1.4 },
      沉降超限: { threshold: 10, minTrigger: 10.5, maxTrigger: 18 },
      设备离线: { threshold: 48, minTrigger: 49, maxTrigger: 90 }
    },
    蓝: {
      水位超阈值: { threshold: 32, minTrigger: 32.2, maxTrigger: 38 },
      水位骤降: { threshold: 1, minTrigger: 1.05, maxTrigger: 1.8 },
      水质异常: { threshold: 0.8, minTrigger: 0.81, maxTrigger: 1.2 },
      沉降超限: { threshold: 8, minTrigger: 8.2, maxTrigger: 13 },
      设备离线: { threshold: 24, minTrigger: 25, maxTrigger: 60 }
    }
  }

  const startDate = new Date('2025-06-18')
  const daysSpan = 365

  distribution.forEach((level, idx) => {
    const daysAgo = Math.floor((idx / distribution.length) * daysSpan)
    const warnDate = new Date(startDate)
    warnDate.setDate(warnDate.getDate() - daysAgo - Math.floor(Math.random() * 30))

    const well = monitoringWells[Math.floor(Math.random() * monitoringWells.length)]
    const warningType = randomChoice(warningTypes)
    const statusOpts = statusWeightsByLevel[level]
    const status = randomChoice(statusOpts)
    const config = thresholdsByLevel[level][warningType]
    const triggerValue = parseFloat((config.minTrigger + Math.random() * (config.maxTrigger - config.minTrigger)).toFixed(2))

    const seq = String(idx + 1).padStart(4, '0')

    warnings.push({
      warningId: `WJ-${seq}`,
      wellId: well.wellId,
      triggerTime: formatDateTime(warnDate),
      warningLevel: level,
      warningType,
      triggerValue,
      threshold: config.threshold,
      status,
      responsiblePerson: randomChoice(responsiblePersons),
      description: randomChoice(warningDescriptions[warningType])
    })
  })

  warnings.sort((a, b) => new Date(b.triggerTime).getTime() - new Date(a.triggerTime).getTime())
  return warnings
}

export const warningEvents: WarningEvent[] = generateWarnings()
