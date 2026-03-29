'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapIcon, HeartIcon, UserGroupIcon, UserIcon } from '@heroicons/react/24/outline'
import {
  MapIcon as MapIconSolid,
  HeartIcon as HeartIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid'

const navItems = [
  { href: '/map', label: 'Map', Icon: MapIcon, IconSolid: MapIconSolid },
  { href: '/friends', label: 'Friends', Icon: UserGroupIcon, IconSolid: UserGroupIconSolid },
  { href: '/matches', label: 'Sessions', Icon: HeartIcon, IconSolid: HeartIconSolid },
  { href: '/dashboard', label: 'Profile', Icon: UserIcon, IconSolid: UserIconSolid },
]

export default function Navbar({
  pendingCount = 0,
  pendingFriendRequests = 0,
  friendRequestCount = 0,
}: {
  pendingCount?: number
  pendingFriendRequests?: number
  friendRequestCount?: number
}) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-stone-200/50 shadow-lg safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map(({ href, label, Icon, IconSolid }) => {
          const active = pathname.startsWith(href)
          const ActiveIcon = active ? IconSolid : Icon
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors relative ${
                active ? 'text-amber-600' : 'text-stone-400 hover:text-amber-500'
              }`}
            >
              <div className="relative">
                <ActiveIcon className="w-6 h-6" />
                {label === 'Sessions' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
                {label === 'Friends' && (pendingFriendRequests > 0 || friendRequestCount > 0) && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {Math.max(pendingFriendRequests, friendRequestCount) > 9 ? '9+' : Math.max(pendingFriendRequests, friendRequestCount)}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-amber-600' : 'text-stone-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
