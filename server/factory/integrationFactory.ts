import UpstoxManager from '../brokerManager/upstoxManager';
import type { IBrokerCredintials } from '../Models/IntegrationCredintials';

export interface ApiManager {
    getAuthUrl(credentials: IBrokerCredintials): string;
    getToken(credentials: IBrokerCredintials, code: string): Promise<string>;
    establishMarketDataFeed(access_token: string): Promise<void>;
    getInstrumentDetails(query: string, limit?: number): Promise<string[]>;
    getHistoricalData(
        instrumentKey: string,
        interval: string,
        fromDate: string,
        toDate: string,
    ): Promise<number>;
    subscribeInstrument(userId: string, instrumentKey: string): Promise<void>;
    deleteSubscription(userId: string): Promise<boolean>;
}

export type ManagerConstructors = {
    upstox: typeof UpstoxManager;
};

export class IntegrationFactory {
    private readonly Managers: ManagerConstructors = {
        upstox: UpstoxManager,
    };

    /**
     * Retrieves and instantiates a specific API manager.
     * @param managerName The name of the manager to retrieve (e.g., 'UpstoxManager').
     * @returns A new instance of the requested manager.
     * @throws Error if the requested manager is not found.
     */
    public getManager<T extends keyof ManagerConstructors>(
        managerName: T,
    ): InstanceType<ManagerConstructors[T]> {
        const ManagerClass = this.Managers[managerName];

        if (!ManagerClass) {
            throw new Error(
                `Manager "${String(managerName)}" not found. Available managers: ${Object.keys(this.Managers).join(', ')}`,
            );
        }
        return new ManagerClass() as InstanceType<ManagerConstructors[T]>;
    }
}
