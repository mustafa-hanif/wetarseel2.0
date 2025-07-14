#!/usr/bin/env bun
// IMPORTANT: Set environment BEFORE any imports
process.env.ENVIRONMENT = 'dev';
process.env.DYNAMODB_TABLE_NAME = 'WeTable';
console.log('Environment setup:');
console.log('ENVIRONMENT:', process.env.ENVIRONMENT);
console.log('DYNAMODB_TABLE_NAME:', process.env.DYNAMODB_TABLE_NAME);
// Import the handler components
const { WeTable, Connection } = await import('./handler.ts');
console.log('\nTable configuration:');
console.log('Table name:', WeTable.name);
console.log('Table partitionKey:', WeTable.partitionKey);
console.log('Table sortKey:', WeTable.sortKey);
// Test a simple operation
try {
    console.log('\nTesting Connection entity...');
    const result = await Connection.build({ type: 'get' })
        .key({
        id: 'test-123',
        connectionId: 'test-123'
    })
        .send();
    console.log('✅ Connection test passed:', result);
}
catch (error) {
    console.log('❌ Connection test failed:', error.name, error.message);
}
