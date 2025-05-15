declare module 'QCache' {
  export default class QCache {
    constructor(
      cacheType: string,
      dbType: string,
      cacheConnection: any,
      dbConnection: any
    );
    setData(
      cacheName: string,
      query: string,
      keys: string[]
    ): Promise<void>;
    getData(
      cacheName: string,
      query: string,
      params: Record<string, any>,
      filterPath?: string
    ): Promise<{ fromCache: boolean; data: any }>;
  }
}
