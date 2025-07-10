#!/usr/bin/env bun
import { db, pool } from "./db";

async function testDatabaseConnection() {
  console.log("🔍 Testing database connection...");
  console.log(
    "Database URL:",
    process.env.ZAPATOS_DB_URL ? "✅ Set" : "❌ Not set"
  );

  try {
    // Test basic connection
    console.log("\n📡 Testing basic connection...");
    const result = await db.sql`SELECT 1 as test`.run(pool);
    console.log("✅ Basic connection successful:", result);

    // Test if we can query the database
    console.log("\n📋 Testing database queries...");
    const versionResult = await db.sql`SELECT version()`.run(pool);
    console.log("✅ Database version:", versionResult[0]?.version);

    // List all tables
    console.log("\n📊 Listing all tables...");
    const tablesResult = await db.sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `.run(pool);

    console.log("📋 Available tables:");
    tablesResult.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });

    // Check if leads table exists
    console.log("\n🎯 Checking for 'leads' table specifically...");
    const leadsTableCheck = await db.sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'leads'
      ) as exists
    `.run(pool);

    if (leadsTableCheck[0]?.exists) {
      console.log("✅ 'leads' table exists!");

      // Check leads table structure
      console.log("\n🔍 Checking 'leads' table structure...");
      const columnsResult = await db.sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads'
        ORDER BY ordinal_position
      `.run(pool);

      console.log("📊 Leads table columns:");
      columnsResult.forEach((col: any) => {
        console.log(
          `  - ${col.column_name} (${col.data_type}) ${col.is_nullable === "YES" ? "NULL" : "NOT NULL"}`
        );
      });

      // Test a simple query on leads table
      console.log("\n🧪 Testing simple query on leads table...");
      const countResult = await db.sql`SELECT COUNT(*) as count FROM leads`.run(
        pool
      );
      console.log(`✅ Leads table has ${countResult[0]?.count} records`);

      // Test the exact query from your API
      console.log("\n🎯 Testing your API query...");
      const apiTestQuery = db.sql`
        SELECT * FROM ${db.raw("leads")} 
        WHERE name ILIKE ${db.param("%" + "" + "%")}
        LIMIT ${db.param(10)}
      `;

      const apiResult = await apiTestQuery.run(pool);
      console.log(
        `✅ API query successful! Returned ${apiResult.length} records`
      );
    } else {
      console.log("❌ 'leads' table does NOT exist!");
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        name: error.name,
      });
    }
  } finally {
    // Close the connection pool
    await pool.end();
    console.log("\n🔌 Connection pool closed");
  }
}

// Run the test
testDatabaseConnection();
