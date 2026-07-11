'use client'

import { usePathname } from 'next/navigation'
import { menuConfig } from '@/config/menu'

export function Header() {
  const pathname = usePathname()
  
  // Find current menu title
  const currentMenu = menuConfig.find(item => 
    pathname === item.href || pathname.startsWith(item.href + '/')
  )
  const title = currentMenu ? currentMenu.title : 'Dashboard'

  return (
    <header className="h-16 flex items-center px-8 border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 transition-colors duration-300 shrink-0">
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        {/* Placeholder for future header items like theme toggle or notifications */}
      </div>
    </header>
  )
}
