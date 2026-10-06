const jakarta = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" });

export const todayJakarta = () => new Date(`${jakarta.format(new Date())}T00:00:00Z`);

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export const parseYmd = (value: string | undefined) => (value && YMD.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) ? value : null);
