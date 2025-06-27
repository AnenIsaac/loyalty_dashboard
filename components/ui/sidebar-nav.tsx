'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  BarChart3, 
  Users, 
  Building2, 
  Gift, 
  LogOut 
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth'

const navItems = [
  {
    title: 'Reports',
    href: '/protected/reports',
    icon: BarChart3
  },
  {
    title: 'Customers',
    href: '/protected/customers',
    icon: Users
  },
  {
    title: 'Business Profile',
    href: '/protected/business',
    icon: Building2
  },
  {
    title: 'Rewards',
    href: '/protected/rewards',
    icon: Gift
  }
]

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) throw new Error(error.message)
      
      // Force a hard redirect to ensure complete logout
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if there's an error, try to redirect to login
      window.location.href = '/auth/login'
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 py-4">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                  pathname === item.href ? "bg-accent" : "transparent"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )
} 