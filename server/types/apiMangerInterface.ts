import type { IBrokerCredintials } from '../Models/IntegrationCredintials';

export interface ApiManager {
    getAuthUrl(credentials: IBrokerCredintials): string;
    getToken(credentials: IBrokerCredintials, code: string): Promise<string>;
    establishMarketDataFeed(
        access_token: string,
        subscribedInstrument: string[],
    ): Promise<void>;
    getInstrumentDetails(query: string, limit?: number): Promise<string[]>;
    getHistoricalData(
        instrumentKey: string,
        interval: string,
        fromDate: string,
        toDate: string,
    ): Promise<number>;
    subscribeInstrument(userId: string, instrumentKey: string): Promise<void>;
    deleteSubscription(
        userId: string,
        instrumentName: string,
    ): Promise<boolean>;
}
