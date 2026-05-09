import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [tables] = await connection.execute('SHOW TABLES');

console.log('Available tables:');
tables.forEach(t => {
  const tableName = Object.values(t)[0];
  console.log(`  - ${tableName}`);
});

await connection.end();
