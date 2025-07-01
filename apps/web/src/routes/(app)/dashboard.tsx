import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/(app)/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(auth)/dashboard"!</div>
}
