import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to import admissions seed data.');
}

const payload = JSON.parse(await fs.readFile(new URL('./admissions_seed.json', import.meta.url), 'utf8'));
const connection = await mysql.createConnection(databaseUrl);

function placeholders(rows, columns) {
  return rows.map(() => `(${Array.from({ length: columns }, () => '?').join(',')})`).join(',');
}

function chunks(items, size) {
  const result = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

try {
  await connection.beginTransaction();

  if (payload.schools.length) {
    await connection.execute(
      `INSERT INTO schools (name) VALUES ${placeholders(payload.schools, 1)} ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      payload.schools,
    );
  }

  if (payload.seatCapacities.length) {
    const values = payload.seatCapacities.flatMap((seat) => [seat.school, seat.grade, seat.capacity]);
    await connection.execute(
      `INSERT INTO seatCapacities (school, grade, capacity) VALUES ${placeholders(payload.seatCapacities, 3)} ON DUPLICATE KEY UPDATE capacity = VALUES(capacity)`,
      values,
    );
  }

  for (const batch of chunks(payload.students, 200)) {
    const values = batch.flatMap((student) => [
      student.studentId,
      student.name,
      student.gender,
      student.nationality,
      student.school,
      student.grade,
      student.status,
      student.registrationDate.slice(0, 19).replace('T', ' '),
      student.paymentStatus,
      student.paymentMethod,
      student.fileComplete ? 1 : 0,
    ]);
    await connection.execute(
      `INSERT INTO students
        (studentId, name, gender, nationality, school, grade, status, registrationDate, paymentStatus, paymentMethod, fileComplete)
       VALUES ${placeholders(batch, 11)}
       ON DUPLICATE KEY UPDATE
        name = VALUES(name), gender = VALUES(gender), nationality = VALUES(nationality), school = VALUES(school),
        grade = VALUES(grade), status = VALUES(status), registrationDate = VALUES(registrationDate),
        paymentStatus = VALUES(paymentStatus), paymentMethod = VALUES(paymentMethod), fileComplete = VALUES(fileComplete)`,
      values,
    );
  }

  await connection.commit();
  console.log(`Imported ${payload.schools.length} schools, ${payload.seatCapacities.length} capacities, and ${payload.students.length} students.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
