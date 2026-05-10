import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Add a section for AMIS Boys Grade 1
const [result] = await connection.execute(
  'INSERT INTO sections (school, grade, section_name, capacity, available_seats) VALUES (?, ?, ?, ?, ?)',
  ['AMIS Boys', 'Grade 1', 'A', 30, 30]
);

console.log('✅ Section added:', result);

// Verify
const [sections] = await connection.execute(
  'SELECT * FROM sections WHERE school = ? AND grade = ?',
  ['AMIS Boys', 'Grade 1']
);

console.log('Sections for AMIS Boys Grade 1:', sections);

await connection.end();
