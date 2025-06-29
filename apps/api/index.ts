const server = Bun.serve({
  port: 80,
  fetch(req) {
    return new Response("Hello from Bun backend!");
  },
});

console.log(`API running at http://localhost:${server.port}`);
