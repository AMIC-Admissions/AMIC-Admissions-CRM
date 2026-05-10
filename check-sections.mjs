import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/').pop() || 'admissions',
});

const [sections] = await connection.execute(
  'SELECT * FROM sections WHERE school = ? AND grade = ?',
  ['AMIS Boys', 'Grade 1']
);

console.log('Sections for AMIS Boys Grade 1:', sections);

const [allSections] = await connection.execute(
  'SELECT DISTINCT school, grade FROM sections ORDER BY school, grade'
);

console.log('\nAll available school/grade combinations:');
allSections.forEach(s => console.log(`  ${s.school} - ${s.grade}`));

await connection.end();
