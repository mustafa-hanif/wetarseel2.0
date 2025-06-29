import { createFileRoute } from "@tanstack/solid-router";
import { fetchPosts } from "../posts";
export const Route = createFileRoute("/posts")({
  component: Posts,
  loader: () => fetchPosts(),
});

function Posts() {
  const posts = Route.useLoaderData();
  return (
    <div class="p-2">
      <h3>Welcome to the Posts Page!</h3>
      <ul>
        {posts().map((post) => (
          <li>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
