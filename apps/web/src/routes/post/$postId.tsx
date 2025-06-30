import { queryOptions, useQuery } from "@tanstack/solid-query";
import { createFileRoute } from "@tanstack/solid-router";
import { fetchPost } from "../../posts";
import { queryClient } from "../../hooks/useQuery";
import { Match, Switch } from "solid-js";

const postQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["post", id],
    queryFn: () => fetchPost(id),
  });
export const Route = createFileRoute("/post/$postId")({
  component: RouteComponent,
  loader: ({ params }) => {
    if (!params.postId) {
      throw new Error("Post ID is required");
    }
  },
});

function RouteComponent() {
  const params = Route.useParams();
  const query = useQuery(() => postQueryOptions(params().postId));

  return (
    <Switch>
      <Match when={query.isPending}>
        <div>Loading...</div>
      </Match>
      <Match when={query.isSuccess}>
        <div>
          <h1>{query.data?.title}</h1>
          <p>{query.data?.body}</p>
        </div>
      </Match>
    </Switch>
  );
}
