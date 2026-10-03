const jakarta = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" });

export const todayJakarta = () => new Date(`${jakarta.format(new Date())}T00:00:00Z`);
