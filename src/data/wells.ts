import type { MonitoringWell } from '../types'

const districts = ['城东区', '城西区', '城南区', '城北区', '高新区', '经开区']
const districtAreas: Record<string, string[]> = {
  城东区: ['钟山', '玄武湖', '新街口', '珠江路', '马群', '孝陵卫', '尧化', '仙林'],
  城西区: ['鼓楼', '龙江', '江东', '莫愁湖', '汉中门', '清凉山', '江浦', '桥林'],
  城南区: ['雨花台', '夫子庙', '中华门', '安德门', '铁心桥', '西善桥', '板桥', '江宁'],
  城北区: ['浦口', '大厂', '葛塘', '桥北', '泰山', '顶山', '沿江', '盘城'],
  高新区: ['新港', '江宁高新', '江北高新', '徐庄', '麒麟', '白下高新', '建邺高新', '雨花高新'],
  经开区: ['江宁经开', '溧水经开', '高淳经开', '六合经开', '浦口经开', '滨江经开', '雨花经开', '栖霞经开']
}
const aquiferTypes = ['深层承压水', '浅层孔隙水', '岩溶裂隙水']
const statuses = ['在线', '在线', '在线', '在线', '在线', '在线', '离线', '维护']
const equipmentModels = ['YSI-EXO2', 'In-Situ-AquaTroll', 'ONSET-HOBO', 'Solinst-LTC', 'Campbell-CR6', 'HACH-Hydrolab', 'OTT-NetDL', 'SEBA-Hydros']

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomFloat(min: number, max: number, decimals: number = 6): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateWell(index: number): MonitoringWell {
  const district = districts[index % districts.length]
  const areaNames = districtAreas[district]
  const areaName = areaNames[index % areaNames.length]
  const seqNum = String(index + 1).padStart(3, '0')

  const lngOffset = randomFloat(-0.15, 0.15)
  const latOffset = randomFloat(-0.15, 0.15)
  const longitude = 118.78 + lngOffset
  const latitude = 32.04 + latOffset

  const wellDepth = randomInt(80, 350)
  const baselineWaterLevel = randomFloat(15, 45, 2)

  const startYear = 2015 + (index % 9)
  const startMonth = String(randomInt(1, 12)).padStart(2, '0')
  const startDay = String(randomInt(1, 28)).padStart(2, '0')

  return {
    wellId: `JCJ-${seqNum}`,
    wellName: `${district}${areaName}监测井${seqNum}号`,
    district,
    longitude,
    latitude,
    wellDepth,
    baselineWaterLevel,
    aquiferType: aquiferTypes[index % aquiferTypes.length],
    status: randomChoice(statuses),
    constructionDate: `${startYear}-${startMonth}-${startDay}`,
    equipmentModel: equipmentModels[index % equipmentModels.length]
  }
}

export const monitoringWells: MonitoringWell[] = Array.from({ length: 50 }, (_, i) => generateWell(i))
