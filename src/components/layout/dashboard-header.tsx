'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Settings, Zap, Sun, Moon, Monitor, LogOut, Menu } from 'lucide-react'
import Link from 'next/link'

export function DashboardHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get initials
  const name = session?.user?.name || session?.user?.email || 'User'
  const initials = name.substring(0, 2).toUpperCase()

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="h-16 flex items-center justify-between md:justify-end px-4 md:px-8 border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 shrink-0">
      
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <Menu size={24} />
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 text-white flex items-center justify-center font-semibold text-sm shadow-md hover:opacity-90 transition-opacity"
        >
          {initials}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-2 w-56 flex flex-col gap-1 z-50 animate-in fade-in zoom-in duration-200">
            
            {/* User Info */}
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{session?.user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session?.user?.email}</p>
            </div>
            
            <div className="h-px bg-gray-200 dark:bg-white/10 my-1" />

            {/* Menu Items */}
            <Link
              href="/dashboard/pricing"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-purple-600 dark:text-purple-400 font-medium hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
            >
              <Zap size={16} className="fill-current" />
              Upgrade ke Pro
            </Link>

            <div className="h-px bg-gray-200 dark:bg-white/10 my-1" />

            {/* Theme Switcher */}
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Tema</span>
              <div className="flex items-center bg-gray-100 dark:bg-black/50 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-1.5 rounded-md transition-colors ${theme === 'light' ? 'bg-white dark:bg-zinc-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  <Sun size={14} />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-white dark:bg-zinc-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  <Moon size={14} />
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`p-1.5 rounded-md transition-colors ${theme === 'system' ? 'bg-white dark:bg-zinc-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  <Monitor size={14} />
                </button>
              </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-white/10 my-1" />

            {/* Logout */}
            <button
              onClick={() => {
                setIsOpen(false)
                signOut({ callbackUrl: '/login' })
              }}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} />
              Keluar
            </button>

          </div>
        )}
      </div>
    </div>
  )
}
