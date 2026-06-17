import type { MaintenanceRecord, MaintenanceType } from '../types'
import { monitoringWells } from './wells'

const maintenancePersons = [
  '王建国', '李卫东', '张海涛', '刘志强', '陈文博',
  '赵启明', '孙建军', '周明辉', '吴振华', '郑远航',
  '冯志远', '杨立新', '何伟民', '马国庆', '黄宇翔',
  '朱家豪', '林建华', '郭为民', '梁志超', '高文彬'
]

const maintenanceContents: Record<MaintenanceType, string[]> = {
  日常巡检: [
    '检查井房设施及周边环境，确认无异常',
    '检查供电系统、防雷装置运行正常',
    '检查数据传输天线及通信模块状态',
    '清洁传感器表面，检查线缆连接情况',
    '核对现场水位与远传数据一致性',
    '检查井口保护装置，清理井内杂物'
  ],
  传感器校准: [
    '采用标准溶液对pH电极进行两点校准',
    '水位传感器与钢尺水位计比对校准',
    '温度传感器与标准水银温度计比对',
    '电导率传感器使用标准KCl溶液标定',
    '对压力传感器进行零点及量程校准',
    '校准数据记录完整，偏差在允许范围内'
  ],
  设备维修: [
    '修复数据传输模块SIM卡座松动问题',
    '更换故障电源适配器，恢复正常供电',
    '维修水位传感器信号线缆破损处',
    '处理数采仪通信接口氧化接触不良',
    '修复太阳能充电控制器故障',
    '排查并解决数据上传中断问题'
  ],
  水泵更换: [
    '原有潜水泵磨损严重，更换同型号新泵',
    '提升泵出水量下降，更换为大功率型号',
    '水泵电机烧毁，整体更换含电缆组件',
    '更换水泵并同步清洗井内沉砂',
    '旧水泵腐蚀严重，升级为不锈钢材质',
    '更换水泵后测试运行参数正常'
  ]
}

const maintenanceResults: Record<MaintenanceType, string[]> = {
  日常巡检: [
    '一切正常，无需处置',
    '发现少量杂物已清理',
    '通信信号略弱，调整天线角度',
    '设备运行状态良好',
    '外观整洁，数据采集正常'
  ],
  传感器校准: [
    '校准完成，偏差<0.5%，符合要求',
    '校准数据记录归档，设备恢复使用',
    '线性度良好，校准结果合格',
    '更换电极后重新校准，数据稳定',
    '校准完成，已更新系统校准参数'
  ],
  设备维修: [
    '维修完成，功能恢复正常',
    '更换备件后测试通过',
    '故障排除，数据恢复上传',
    '修复后连续运行48小时无异常',
    '问题已解决，建议加强日常巡检'
  ],
  水泵更换: [
    '新泵安装完成，试水合格',
    '更换后流量、扬程达到设计参数',
    '试运行72小时稳定，交付使用',
    '含水泵调试、管路冲洗全部完成',
    '更换完成，建立新设备档案'
  ]
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateMaintenanceRecords(): MaintenanceRecord[] {
  const records: MaintenanceRecord[] = []
  const totalRecords = 60
  const startDate = new Date('2023-06-18')
  const daysSpan = 1095

  const types: MaintenanceType[] = [
    ...Array(25).fill('日常巡检'),
    ...Array(15).fill('传感器校准'),
    ...Array(12).fill('设备维修'),
    ...Array(8).fill('水泵更换')
  ]

  const shuffledTypes = types.sort(() => Math.random() - 0.5)

  for (let i = 0; i < totalRecords; i++) {
    const well = monitoringWells[Math.floor(Math.random() * monitoringWells.length)]
    const mType = shuffledTypes[i]

    const daysOffset = Math.floor(Math.random() * daysSpan)
    const mDate = new Date(startDate)
    mDate.setDate(mDate.getDate() + daysOffset)

    const y = mDate.getFullYear()
    const m = String(mDate.getMonth() + 1).padStart(2, '0')
    const d = String(mDate.getDate()).padStart(2, '0')

    const seq = String(i + 1).padStart(4, '0')

    records.push({
      recordId: `MT-${seq}`,
      wellId: well.wellId,
      maintenanceDate: `${y}-${m}-${d}`,
      maintenanceType: mType,
      content: randomChoice(maintenanceContents[mType]),
      maintenancePerson: randomChoice(maintenancePersons),
      result: randomChoice(maintenanceResults[mType])
    })
  }

  records.sort((a, b) => new Date(b.maintenanceDate).getTime() - new Date(a.maintenanceDate).getTime())
  return records
}

export const maintenanceRecords: MaintenanceRecord[] = generateMaintenanceRecords()
