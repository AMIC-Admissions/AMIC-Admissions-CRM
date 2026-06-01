import { getSeatAvailabilityRows } from "./db";

function buildAvailabilityResponse(seats: Awaited<ReturnType<typeof getSeatAvailabilityRows>>) {
  const totalCapacity = seats.reduce((sum, seat) => sum + (seat.capacity || 0), 0);
  const totalReserved = seats.reduce((sum, seat) => sum + (seat.reserved || 0), 0);
  const totalAvailable = totalCapacity - totalReserved;

  return {
    success: true,
    seats,
    totalCapacity,
    totalReserved,
    totalAvailable,
  };
}

export async function getSeatAvailability() {
  const seats = await getSeatAvailabilityRows();
  return buildAvailabilityResponse(seats);
}

export async function getSeatAvailabilityBySchool(school: string) {
  const seats = await getSeatAvailabilityRows({ school });
  if (seats.length === 0) {
    return {
      success: false,
      message: `No seats found for school: ${school}`,
      seats: [],
    };
  }

  return {
    school,
    ...buildAvailabilityResponse(seats),
  };
}

export async function getSeatAvailabilityByGrade(grade: string) {
  const seats = await getSeatAvailabilityRows({ grade });
  if (seats.length === 0) {
    return {
      success: false,
      message: `No seats found for grade: ${grade}`,
      seats: [],
    };
  }

  return {
    grade,
    ...buildAvailabilityResponse(seats),
  };
}

export async function getLowAvailabilitySeats() {
  const availability = await getSeatAvailability();
  const lowSeats = availability.seats.filter((seat) => seat.available < 5);

  return {
    success: true,
    lowSeats,
    count: lowSeats.length,
  };
}
