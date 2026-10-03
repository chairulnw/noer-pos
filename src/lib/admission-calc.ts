const DAY_MS = 86_400_000;
const OFFSET_MS = 7 * 3_600_000;

const jakartaDay = (date: Date) => Math.floor((date.getTime() + OFFSET_MS) / DAY_MS);

export const calendarDays = (from: Date, to: Date) => jakartaDay(to) - jakartaDay(from);

export const billedDays = (checkIn: Date, checkOut: Date) => Math.max(1, calendarDays(checkIn, checkOut));

export const stayDay = (checkIn: Date, now: Date) => Math.max(1, calendarDays(checkIn, now) + 1);

export const jakartaLocalToDate = (local: string) => new Date(`${local}:00+07:00`);

export const dateToJakartaLocal = (date: Date) => new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 16);
