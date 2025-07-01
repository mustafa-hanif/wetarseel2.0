import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/(app)/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(auth)/profile"!</div>
}
