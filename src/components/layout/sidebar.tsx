'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, ChevronRight, LayoutDashboard, History, BarChart3, Settings, Play, User, LogOut, UserCircle, Users, Lock, Shield, Key, Activity, Wand2, Package, CreditCard, Receipt, Ticket, Sparkles, Library } from 'lucide-react'
import { useState } from 'react'
import { menuConfig, MenuItem } from '@/config/menu'
import { useSession, signOut } from 'next-auth/react'

const iconMap: Record<string, any> = {
  LayoutDashboard,
  History,
  BarChart3,
  Settings,
  UserCircle,
  Users,
  Lock,
  Shield,
  Key,
  Activity,
  Wand2,
  Package,
  CreditCard,
  Receipt,
  Ticket,
  Sparkles,
  Library,
}

function hasPermission(userRole: string, userPermissions: string[] = [], requiredPermission?: string): boolean {
  if (userRole === 'SuperAdmin') return true
  if (!requiredPermission) return true
  return userPermissions.includes(requiredPermission) || userPermissions.includes('*:*')
}

function MenuItemComponent({ item, level = 0 }: { item: MenuItem; level?: number }) {
  const { data: session } = useSession()
  const userRole = session?.user?.role || 'User'
  const userPermissions = session?.user?.permissions || []
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  if (!hasPermission(userRole, userPermissions, item.permission)) {
    return null
  }

  const Icon = iconMap[item.icon]
  const isActive = item.href === '/dashboard' 
    ? pathname === '/dashboard' 
    : (pathname === item.href || pathname.startsWith(item.href + '/'))
  const hasChildren = item.children && item.children.length > 0

  return (
    <div className="mb-1">
      <Link
        href={hasChildren ? '#' : item.href}
        onClick={(e) => {
          if (hasChildren) {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm ${
          isActive
            ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 shadow-sm shadow-purple-500/10'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-500/5 hover:translate-x-1'
        } ${level > 0 ? 'ml-4' : ''}`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <div className={`${isActive ? 'text-purple-700 dark:text-purple-300' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'} transition-colors duration-300`}>
          {Icon && <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />}
        </div>
        <span className="flex-1">{item.title}</span>
        {hasChildren && (isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
      </Link>
      
      {hasChildren && isOpen && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child, idx) => (
            <MenuItemComponent key={idx} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

import { UserPlanBadge } from './user-plan-badge'

export function Sidebar() {
  const { data: session } = useSession()

  return (
    <aside className="w-64 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-white/10 h-screen sticky top-0 flex flex-col transition-colors duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-white/10 justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="bg-red-500 text-white p-1.5 rounded-lg flex items-center justify-center">
            <Play size={20} strokeWidth={2.5} fill="currentColor" />
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            NoteTube
          </span>
        </Link>
        <UserPlanBadge />
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {menuConfig.map((item, idx) => (
          <MenuItemComponent key={idx} item={item} />
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-md">
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left flex items-center gap-3 p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors border border-transparent dark:hover:border-red-500/10 group"
        >
          <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors flex-shrink-0">
            <LogOut size={18} />
          </div>
          <span className="font-medium text-sm">Keluar</span>
        </button>
      </div>
    </aside>
  )
}