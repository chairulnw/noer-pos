export const PAGE_SIZES = [10, 25, 50] as const;

export type PagingParams = { hal?: string; baris?: string };

export function parsePaging({ hal, baris }: PagingParams) {
  const size = (PAGE_SIZES as readonly number[]).includes(Number(baris)) ? Number(baris) : PAGE_SIZES[0];
  const page = Math.max(1, Math.floor(Number(hal)) || 1);
  return { page, size, skip: (page - 1) * size, take: size };
}

export function pageRange(total: number, page: number, size: number) {
  return {
    from: total === 0 ? 0 : Math.min((page - 1) * size + 1, total),
    to: Math.min(total, page * size),
    pages: Math.max(1, Math.ceil(total / size)),
  };
}

export function buildHref(base: string, params: Record<string, string | undefined>, patch: Record<string, string | undefined> = {}) {
  const query = new URLSearchParams(Object.entries({ ...params, ...patch }).filter((entry): entry is [string, string] => Boolean(entry[1])));
  const text = query.toString();
  return text ? `${base}?${text}` : base;
}

export type SortParams = { urut?: string; arah?: string };
export type SortDir = "asc" | "desc";

export function parseSort<S extends Record<string, (dir: SortDir) => unknown>>(params: SortParams, sorts: S) {
  const key = params.urut && Object.hasOwn(sorts, params.urut) ? params.urut : undefined;
  const dir: SortDir = params.arah === "desc" ? "desc" : "asc";
  const orderBy = key ? (sorts[key](dir) as ReturnType<S[keyof S]>) : undefined;
  return { key, dir, orderBy, keep: { urut: key, arah: key ? dir : undefined } };
}

export function sortRows<T>(rows: T[], key: string | undefined, dir: SortDir, pick: Record<string, (row: T) => string | number | null>) {
  const get = key ? pick[key] : undefined;
  if (!get) return rows;
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = get(a), y = get(b);
    if (x === y) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "id")) * sign;
  });
}
