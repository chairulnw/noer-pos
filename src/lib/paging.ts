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
