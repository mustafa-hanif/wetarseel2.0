#!/usr/bin/env bun

console.log("🔍 Environment Check:");
console.log(
  "ZAPATOS_DB_URL:",
  process.env.ZAPATOS_DB_URL ? "✅ Set" : "❌ Not set"
);
console.log("Full URL:", process.env.ZAPATOS_DB_URL);
console.log("");
console.log("Other env vars:");
console.log(
  "BETTER_AUTH_SECRET:",
  process.env.BETTER_AUTH_SECRET ? "✅ Set" : "❌ Not set"
);
console.log(
  "AWS_ACCESS_KEY_ID:",
  process.env.AWS_ACCESS_KEY_ID ? "✅ Set" : "❌ Not set"
);
