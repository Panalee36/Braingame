import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'เกมฝึกสมอง - ลดความเสี่อมของสมอง',
  description: 'แอปพลิเคชันเกมฝึกสมองสำหรับผู้สูงอายุ เพื่อกระตุ้นสมองและสุขภาพจิต',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=yes, maximum-scale=5',
  icons: {
    icon: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'เกมฝึกสมอง',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <head>
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="เกมฝึกสมอง" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
          {children}
        </main>
      </body>
    </html>
  )
}
