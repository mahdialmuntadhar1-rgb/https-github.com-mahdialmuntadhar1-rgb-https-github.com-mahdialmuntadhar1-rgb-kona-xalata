type QueryValue = string | number | boolean;

type SelectResult<T> = Promise<{ data: T[] | null; error: Error | null }>;

class QueryBuilder<T = Record<string, unknown>> implements PromiseLike<{ data: T[] | null; error: Error | null }> {
  private readonly filters: string[] = [];
  private readonly url: string;
  private readonly headers: HeadersInit;

  constructor(url: string, headers: HeadersInit, private readonly table: string) {
    this.url = `${url}/rest/v1/${table}`;
    this.headers = headers;
  }

  select(columns: string) {
    this.filters.push(`select=${encodeURIComponent(columns)}`);
    return this;
  }

  eq(column: string, value: QueryValue) {
    this.filters.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(String(value))}`);
    return this;
  }

  ilike(column: string, value: string) {
    this.filters.push(`${encodeURIComponent(column)}=ilike.${encodeURIComponent(value)}`);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const direction = options?.ascending === false ? 'desc' : 'asc';
    this.filters.push(`order=${encodeURIComponent(`${column}.${direction}`)}`);
    return this;
  }

  limit(value: number) {
    this.filters.push(`limit=${value}`);
    return this;
  }

  range(from: number, to: number) {
    const safeFrom = Math.max(0, from);
    const safeTo = Math.max(safeFrom, to);
    this.filters.push(`offset=${safeFrom}`);
    this.filters.push(`limit=${safeTo - safeFrom + 1}`);
    return this;
  }

  then<TResult1 = { data: T[] | null; error: Error | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T[] | null; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): SelectResult<T> {
    try {
      const response = await fetch(`${this.url}?${this.filters.join('&')}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        const message = await response.text();
        return { data: null, error: new Error(message || `Request failed with ${response.status}`) };
      }

      const data = (await response.json()) as T[];
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown Supabase error') };
    }
  }
}

export function createClient(url: string, anonKey: string) {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };

  return {
    from<T = Record<string, unknown>>(table: string) {
      return new QueryBuilder<T>(url, headers, table);
    },
  };
}
