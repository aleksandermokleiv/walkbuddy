import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Climb Squad — Find Your Climbing Partner',
  description: 'Connect with climbers nearby for gym sessions, sport climbing, bouldering, and more',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-stone-50 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
