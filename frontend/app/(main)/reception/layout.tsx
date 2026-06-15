import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tiếp nhận | SkinLab',
  description: 'Quản lý tiếp nhận khách hàng, đăng ký khám và lịch hẹn',
}

export default function ReceptionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
