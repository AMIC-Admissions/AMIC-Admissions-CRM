#!/usr/bin/env node

import { runFullDataFix } from "./server/dataFix";

console.log("🚀 Starting data fix...\n");

try {
  const result = await runFullDataFix();
  console.log("\n✅ Data fix completed successfully!");
  console.log("📊 Result:", JSON.stringify(result, null, 2));
  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error);
  process.exit(1);
}
