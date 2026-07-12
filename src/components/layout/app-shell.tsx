'use client'

import { useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { Sidebar } from './sidebar'
import { DashboardHeader } from './dashboard-header'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="flex h-screen overflow-hidden bg-white dark:bg-black relative">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <DashboardHeader onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
            <div className="p-4 md:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}