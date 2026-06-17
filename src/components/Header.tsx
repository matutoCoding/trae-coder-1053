import { useState, useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Search,
  Bell,
  Wrench,
  ChevronRight,
  Home,
  LogOut,
  User,
  ChevronsRight,
} from 'lucide-react'
import { warningEvents } from '../data/warnings'

const routeMap: Record<string, string> = {
  '/': '监测井网',
  '/water-level': '水位数据',
  '/drawdown-trend': '降深趋势',
  '/land-subsidence': '地面沉降',
  '/overdraft-warning': '超采预警',
  '/recharge-management': '回灌管理',
  '/report-generation': '报告生成',
}

export default function Header() {
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const currentPageName = routeMap[location.pathname] || '未知页面'

  const pendingCount = useMemo(
    () => warningEvents.filter((w) => w.status === '待处置').length,
    []
  )

  return (
    <div className="flex items-center justify-between gap-4">
      <nav className="flex items-center gap-2 text-sm">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-slate-500 transition-colors hover:text-secondary"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">首页</span>
        </Link>
        {location.pathname !== '/' && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <ChevronsRight className="h-3.5 w-3.5 text-slate-300 sm:hidden" />
            <span className="font-medium text-slate-700">{currentPageName}</span>
          </>
        )}
        {location.pathname === '/' && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <ChevronsRight className="h-3.5 w-3.5 text-slate-300 sm:hidden" />
            <span className="font-medium text-secondary">监测井网</span>
          </>
        )}
      </nav>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索监测井、预警..."
            className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-secondary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>

        <div className="relative">
          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-all hover:bg-slate-100 hover:text-secondary"
            title="预警通知"
          >
            <Bell className="h-5 w-5" />
            {pendingCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow-lg shadow-danger/30">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative group">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-all hover:bg-slate-100 hover:text-warning"
            title="设备维护 Maintenance"
          >
            <Wrench className="h-5 w-5" />
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-all hover:bg-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-secondary via-primary to-sidebar text-sm font-bold text-white shadow-md shadow-secondary/20">
              管
            </div>
            <span className="hidden text-sm font-medium text-slate-700 sm:block">管理员</span>
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-200/60">
                <div className="border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-secondary via-primary to-sidebar text-sm font-bold text-white">
                      管
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">管理员</p>
                      <p className="text-xs text-slate-500">系统管理员</p>
                    </div>
                  </div>
                </div>
                <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary">
                  <User className="h-4 w-4" />
                  <span>管理员</span>
                </button>
                <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-danger">
                  <LogOut className="h-4 w-4" />
                  <span>退出登录</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
