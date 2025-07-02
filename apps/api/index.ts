import { auth } from "./auth";
import doSomething from "./db";

const server = Bun.serve({
  port: 4000,
  routes: {
    "/": () => new Response("Welcome to the API!"),
    "/health": () => new Response("API is healthy!"),
    "/api/auth/*": async (req: Request) => {
      const a = await auth.handler(req);
      return a;
    },
    "/hello": () => {
      doSomething();
      return new Response("Hello World!");
    },
  },
});

console.log(`API running at http://localhost:${server.port}`);
