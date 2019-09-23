export declare class StopStore {
    private dbName;
    constructor(dbName: string);
    import(saveStops: any): Promise<void>;
    query(lat: any, lng: any, r: any): Promise<unknown>;
    openDb(): Promise<IDBDatabase>;
    getLogEntry(): Promise<{
        version: number;
        updated: number;
    }>;
    maintainDb(): Promise<void>;
}
