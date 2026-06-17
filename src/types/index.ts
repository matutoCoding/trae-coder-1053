export interface MonitoringWell {
  wellId: string
  wellName: string
  district: string
  longitude: number
  latitude: number
  wellDepth: number
  baselineWaterLevel: number
  aquiferType: string
  status: string
  constructionDate: string
  equipmentModel: string
}

export interface WaterLevelRecord {
  recordId: string
  wellId: string
  collectionTime: string
  waterDepth: number
  waterTemperature: number
  conductivity: number
  isAbnormal: boolean
  qualityFlag: string
}

export interface WaterQualityRecord {
  recordId: string
  wellId: string
  testDate: string
  ph: number
  tds: number
  totalHardness: number
  fluoride: number
  waterQualityClass: string
}

export interface SubsidenceStation {
  stationId: string
  stationName: string
  longitude: number
  latitude: number
  initialElevation: number
  relatedWellId: string
}

export interface SubsidenceRecord {
  recordId: string
  stationId: string
  measureDate: string
  currentElevation: number
  cumulativeSubsidence: number
  annualSubsidence: number
}

export type WarningLevel = '红' | '橙' | '黄' | '蓝'
export type WarningStatus = '待处置' | '处理中' | '已解决'
export type WarningType = '水位超阈值' | '水位骤降' | '水质异常' | '沉降超限' | '设备离线'

export interface WarningEvent {
  warningId: string
  wellId: string
  triggerTime: string
  warningLevel: WarningLevel
  warningType: WarningType
  triggerValue: number
  threshold: number
  status: WarningStatus
  responsiblePerson: string
  description: string
}

export interface RechargeWell {
  rechargeWellId: string
  wellName: string
  district: string
  designRechargeVolume: number
  rechargeWaterSource: string
  status: string
}

export interface RechargeRecord {
  recordId: string
  rechargeWellId: string
  rechargeDate: string
  volume: number
  duration: number
  operator: string
  waterSource: string
  remarks: string
}

export type MaintenanceType = '日常巡检' | '传感器校准' | '设备维修' | '水泵更换'

export interface MaintenanceRecord {
  recordId: string
  wellId: string
  maintenanceDate: string
  maintenanceType: MaintenanceType
  content: string
  maintenancePerson: string
  result: string
}
