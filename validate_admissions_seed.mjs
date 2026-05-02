import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [studentRows] = await connection.execute('select count(*) as count from students');
const [seatRows] = await connection.execute('select count(*) as count from seatCapacities');
const [schoolRows] = await connection.execute('select count(distinct school) as count from students');
const [gradeRows] = await connection.execute('select count(distinct grade) as count from students');
const [sampleRows] = await connection.execute('select studentId, name, school, grade, status from students order by id limit 5');
await connection.end();

const summary = {
  students: Number(studentRows[0].count),
  seatCapacities: Number(seatRows[0].count),
  distinctStudentSchools: Number(schoolRows[0].count),
  distinctStudentGrades: Number(gradeRows[0].count),
  samples: sampleRows,
};

console.log(JSON.stringify(summary, null, 2));
if (summary.students <= 0 || summary.seatCapacities <= 0 || summary.distinctStudentSchools <= 0 || summary.distinctStudentGrades <= 0) {
  throw new Error('Seed validation failed: workbook-derived admissions data is missing or incomplete.');
}
