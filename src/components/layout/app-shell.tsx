import { ThemeProvider } from 'next-themes'
import { Sidebar } from './sidebar'
import { DashboardHeader } from './dashboard-header'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="flex h-screen overflow-hidden bg-white dark:bg-black">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}