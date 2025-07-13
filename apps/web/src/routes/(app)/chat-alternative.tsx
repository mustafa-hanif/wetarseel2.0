import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/(app)/chat-alternative')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(app)/chat-alternative"!</div>
}
