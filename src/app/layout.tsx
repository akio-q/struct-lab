import type { Metadata } from "next"
import { Fira_Code, Geist } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "StructLab",
    template: "%s · StructLab",
  },
  description:
    "An interactive visual playground for arrays, stacks, queues, deques, and doubly linked lists.",
  applicationName: "StructLab",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${firaCode.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  )
}
