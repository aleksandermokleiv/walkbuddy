import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WalkBuddy — Find Your Walking Companion',
  description: 'A community platform for new parents to find walking companions nearby',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-amber-50 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
