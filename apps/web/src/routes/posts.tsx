import { createFileRoute, Link } from "@tanstack/solid-router";
import { fetchPosts } from "../posts";
import { queryOptions, useQuery } from "@tanstack/solid-query";
import { queryClient } from "../hooks/useQuery";

const postsQueryOptions = queryOptions({
  queryKey: ["posts"],
  queryFn: () => fetchPosts(),
});

export const Route = createFileRoute("/posts")({
  component: Posts,
  loader: () => queryClient.ensureQueryData(postsQueryOptions),
});

function Posts() {
  const query = useQuery(() => postsQueryOptions);
  return (
    <div class="p-2">
      <h3>Welcome to the Posts Page!</h3>
      <ul class="flex flex-col gap-2 text-blue-500 underline">
        {query.data?.map((post) => (
          <Link to={`/post/$postId`} params={{ postId: post.id }}>
            {post.title}
          </Link>
        ))}
      </ul>
    </div>
  );
}
