type QueryPayload<T = any> = { data: T; error: Error | null; count?: number | null };
type QueryResult<T = any> = Promise<QueryPayload<T>>;

type Session = { user?: { id: string; email?: string } } | null;

type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED';

type QueryBuilder = any;

export type RealtimeChannel = {
  on: (..._args: any[]) => RealtimeChannel;
  subscribe: () => RealtimeChannel;
};

const createEmptyResult = <T = any>(data: T, count: number | null = null): QueryResult<T> =>
  Promise.resolve({ data, error: null, count });

const createQueryBuilder = (): QueryBuilder => {
  const builder = {
    select: () => builder,
    order: () => builder,
    range: () => builder,
    eq: () => builder,
    or: () => builder,
    gte: () => builder,
    limit: () => builder,
    maybeSingle: () => createEmptyResult(null),
    single: () => createEmptyResult({ id: '' }),
    insert: () => builder,
    update: () => builder,
    upsert: () => builder,
    then: (onfulfilled?: any, onrejected?: any) => createEmptyResult([]).then(onfulfilled, onrejected),
    catch: (onrejected?: any) => createEmptyResult([]).catch(onrejected),
    finally: (onfinally?: any) => createEmptyResult([]).finally(onfinally),
  };
  return builder;
};

const listeners = new Set<(event: AuthChangeEvent, session: Session) => void>();

const auth = {
  async getSession() {
    return { data: { session: null as Session } };
  },
  async getUser() {
    return { data: { user: null as Session['user'] } };
  },
  async signOut() {
    listeners.forEach((listener) => listener('SIGNED_OUT', null));
    return { error: null as Error | null };
  },
  async signInWithOAuth(_options: any) {
    return { error: null as Error | null };
  },
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session) => void) {
    listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => listeners.delete(callback),
        },
      },
    };
  },
};

export const supabase = {
  auth,
  from(_table: string) {
    return createQueryBuilder();
  },
  channel(_name: string): RealtimeChannel {
    const channel: RealtimeChannel = {
      on: () => channel,
      subscribe: () => channel,
    };
    return channel;
  },
  async removeChannel(_channel: RealtimeChannel) {
    return { error: null as Error | null };
  },
};
