import "styles/tailwind.css"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Next.js Enterprise",
    template: "%s - Next.js Enterprise",
  },
  description: "A production-ready template for building enterprise applications with Next.js",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
