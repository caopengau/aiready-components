import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Documentation - aiready",
  description: "Complete guide to aiready tools including Pattern Detection, Context Analysis, and Consistency Checker. Learn how to optimize your codebase for AI collaboration.",
  alternates: {
    canonical: '/docs',
  },
  openGraph: {
    title: "Documentation - aiready",
    description: "Complete guide to aiready tools including Pattern Detection, Context Analysis, and Consistency Checker.",
    url: "https://getaiready.dev/docs",
  },
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
