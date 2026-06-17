import { NavLink } from 'react-router-dom'
import {
  Droplets,
  Map,
  TrendingDown,
  Mountain,
  AlertTriangle,
  ArrowDownToLine,
  FileBarChart,
} from 'lucide-react'

interface MenuItem {
  path: string
  name: string
  icon: React.ComponentType<{ className?: string }>
}

const menuItems: MenuItem[] = [
  { path: '/', name: '监测井网', icon: Map },
  { path: '/water-level', name: '水位数据', icon: Droplets },
  { path: '/drawdown-trend', name: '降深趋势', icon: TrendingDown },
  { path: '/land-subsidence', name: '地面沉降', icon: Mountain },
  { path: '/overdraft-warning', name: '超采预警', icon: AlertTriangle },
  { path: '/recharge-management', name: '回灌管理', icon: ArrowDownToLine },
  { path: '/report-generation', name: '报告生成', icon: FileBarChart },
]

export default function Sidebar() {
  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-slate-200">
      <div className="flex h-16 items-center gap-3 border-b border-slate-700/50 px-5">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-secondary/30" />
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-primary shadow-lg shadow-secondary/30">
            <Droplets className="h-5 w-5 text-white" />
          </div>
        </div>
        <div>
          <h1 className="font-serif text-base font-semibold tracking-wide text-white">
            城市地下水监测系统
          </h1>
          <p className="text-xs text-slate-400">Urban GWMS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-secondary/15 text-secondary shadow-[inset_0_0_0_1px_rgba(0,184,217,0.25)]'
                    : 'text-slate-400 hover:bg-slate-700/40 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-secondary' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(0,184,217,0.6)]" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-slate-700/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/60">
            <FileBarChart className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-300">v1.0.0</span>
            <span className="text-[11px] text-slate-500">水务监测平台</span>
          </div>
        </div>
      </div>
    </div>
  )
}
