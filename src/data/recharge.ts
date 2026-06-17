import type { RechargeWell, RechargeRecord } from '../types'

const districts = ['城东区', '城西区', '城南区', '城北区', '高新区', '经开区']
const rechargeAreaNames: Record<string, string[]> = {
  城东区: ['马群', '仙林', '尧化'],
  城西区: ['江浦', '桥林', '龙江'],
  城南区: ['板桥', '江宁', '铁心桥'],
  城北区: ['浦口', '桥北', '大厂'],
  高新区: ['江北高新', '江宁高新', '新港'],
  经开区: ['滨江经开', '江宁经开', '溧水经开']
}
const rechargeSources = ['长江地表水', '污水处理厂再生水', '雨水收集回用', '水库调水', '南水北调补水']
const rechargeWellStatuses = ['运行中', '运行中', '运行中', '备用', '检修']

const operators = [
  '王军', '李娜', '张伟', '刘洋', '陈晨',
  '杨帆', '赵磊', '孙颖', '周杰', '吴婷',
  '郑浩', '冯超', '马晓', '黄斌', '朱琳'
]

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function generateRechargeWells(): RechargeWell[] {
  const wells: RechargeWell[] = []
  const allNames: { district: string; name: string }[] = []

  Object.entries(rechargeAreaNames).forEach(([district, names]) => {
    names.forEach(name => {
      allNames.push({ district, name })
    })
  })

  const selected = allNames.sort(() => Math.random() - 0.5).slice(0, 10)

  selected.forEach((item, idx) => {
    const seqNum = String(idx + 1).padStart(3, '0')
    wells.push({
      rechargeWellId: `HG-${seqNum}`,
      wellName: `${item.district}${item.name}回灌井${seqNum}号`,
      district: item.district,
      designRechargeVolume: Math.round((50 + Math.random() * 150) * 10) / 10,
      rechargeWaterSource: randomChoice(rechargeSources),
      status: randomChoice(rechargeWellStatuses)
    })
  })

  return wells
}

export const rechargeWells: RechargeWell[] = generateRechargeWells()

function generateRechargeRecords(): RechargeRecord[] {
  const records: RechargeRecord[] = []
  const totalRecords = 200
  const startDate = new Date('2024-06-18')

  for (let i = 0; i < totalRecords; i++) {
    const well = rechargeWells[Math.floor(Math.random() * rechargeWells.length)]
    const daysOffset = Math.floor(Math.random() * 730)
    const recordDate = new Date(startDate)
    recordDate.setDate(recordDate.getDate() + daysOffset)

    const y = recordDate.getFullYear()
    const m = String(recordDate.getMonth() + 1).padStart(2, '0')
    const d = String(recordDate.getDate()).padStart(2, '0')

    const designVol = well.designRechargeVolume
    const volume = randomFloat(designVol * 0.6, designVol * 1.1, 1)
    const duration = randomFloat(2, 12, 1)

    const remarksPool = [
      '', '', '', '',
      '回灌压力稳定，效果良好',
      '中途短暂停泵后恢复',
      '水源水质检测合格',
      '配合水位回升计划实施',
      '首次调试运行，参数已校准',
      '季节补水期强化回灌'
    ]

    const seq = String(i + 1).padStart(5, '0')

    records.push({
      recordId: `HR-${seq}`,
      rechargeWellId: well.rechargeWellId,
      rechargeDate: `${y}-${m}-${d}`,
      volume,
      duration,
      operator: randomChoice(operators),
      waterSource: well.rechargeWaterSource,
      remarks: randomChoice(remarksPool)
    })
  }

  records.sort((a, b) => new Date(b.rechargeDate).getTime() - new Date(a.rechargeDate).getTime())
  return records
}

export const rechargeRecords: RechargeRecord[] = generateRechargeRecords()
