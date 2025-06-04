import axios, { Axios, AxiosHeaders, type AxiosRequestConfig } from "axios";
import { config } from "../utils/config";
import {WebSocket} from "ws";
import { decodeProtoBuf } from "../utils/protobuf";
import { formatDate } from "../utils/utilityFn";
import type { RedisClientType } from "@redis/client";
import type { Instrument } from "../types/upstox.types";
import { exactMatchSearch, prefixSearch } from "../search/searchEngine";


enum URLs {
    authorizationURL = "authorizationURL",
    tokenURL = "tokenURL",
    wsAuthURL = "wsAuthURL",
    historicalData = "historicalData"
}


// get AuthCode
export default class UpstoxManager { 

    
    private readonly API_ENDPOINT = "https://api.upstox.com/v2"
    private readonly client_id = config.upstox.client_id
    private readonly client_secret = config.upstox.client_secret
    private readonly redirect_uri = config.upstox.redirect_uri
    private readonly grant_type = "authorization_code"


    private access_code : string | undefined = config.mode === "dev" ? config.access_code : undefined; 
    public getUpstoxAuthUrl() {
        const url = this.getURLs(URLs.authorizationURL);
        if(!url) {
            throw new Error("AuthorizationUrl is not defined");
        }
        return url
    }

    public async getToken(code : string) {
        const url = this.getURLs(URLs.tokenURL)
        const body = this.getBody(URLs.tokenURL, code);
        const config: AxiosRequestConfig = {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            }
        };
        
        if(!url || !body) {
            throw new Error("URL and BODY is required to get token");
        }
        const response = await axios.post(url,body, config);
        this.access_code = response.data.access_token;
        console.log(this.access_code);
    }

    public async establishUpstoxSocketConnectionAndStreamMarketFeed () { 
        const wsURL = await this.getWsAuthURL();   


        // Find the subscribed Instruments
        const config = {
            headers : {
                "Api-Version" : 2.0,
                "Authorization" : `Bearer ${this.access_code}`
            },
            followRedirects : true,
        }
        const ws = new WebSocket(wsURL,config);
        ws.onopen = () => {
            console.log("Connected");
            const data = {
              guid: "someguid",
              method: "sub",
              data: {
                mode: "full",
                instrumentKeys: ["NSE_EQ|INE669E01016"],
              },
            };
            ws.send(Buffer.from(JSON.stringify(data)));
          };
  
          ws.onclose = () => {
            console.log("Disconnected");
          };
  
          ws.onmessage = async (event) => {
            let response = await decodeProtoBuf(event.data as Buffer) 
            console.log(response.feeds["NSE_EQ|INE669E01016"].ff)
        };
  
          ws.onerror = (error) => {
            console.log("WebSocket error:", error);
          };
    }
    
    public async getLastTradingPriceForAllSubscribedStock() {

        const fromDate = formatDate()
        const toDate = formatDate(7);
        const instrumentKey = "NSE_EQ|INE848E01016";
        const interval = "day";
        const query = `${instrumentKey}/${interval}/${fromDate}/${toDate}`;
        const config : AxiosRequestConfig = {
            headers : {
                Accept : "application/json",
                // Authorization : `Bearer ${this.access_code}`,
            }
        }
        const url = this.getURLs(URLs.historicalData, query);
        console.log(url)
        const response = await axios.get(url, config);
        const close = response.data.data.candles[response.data.data.candles.length - 1][4];
        console.log("close: ", close)
    }

    public async getInstrumetnDetails(query : string, limit : number = 10) {
        try {
            const exactKey = await exactMatchSearch(query);

            if(exactKey.length > 0) {
                return exactKey
            }


            const prefixKey = await prefixSearch(query, limit);
            if(prefixSearch.length > 0) {
                return prefixKey
            }


            return {};
        } catch (error) {
            console.error(error);
            return {}   
        }
    }


    private async getWsAuthURL() {
        if(!this.access_code) {
            throw new Error("Access Code is required. Can not generate the Websocket Authorization URL")
        } 
        const config : AxiosRequestConfig = {
            headers : {
                Authorization : `Bearer ${this.access_code}`,
                Accept : "application/json"
            }
        }
        const url = this.getURLs(URLs.wsAuthURL);
        const response = await axios.get(url, config)
        return response.data.data.authorizedRedirectUri
    }


    private getURLs (Key : URLs, query?: string) {
        const URLS : {[key :string]: string} = {
            authorizationURL : `${this.API_ENDPOINT}/login/authorization/dialog?client_id=${this.client_id}&redirect_uri=${this.redirect_uri}`,
            tokenURL : `${this.API_ENDPOINT}/login/authorization/token`,
            wsAuthURL : `${this.API_ENDPOINT}/feed/market-data-feed/authorize`,
            historicalData : `${this.API_ENDPOINT}/historical-candle/${query}`
        }

        const result = URLS[Key]
        if(!result) {
            throw new Error("The URL is not present in the dictonary") 
        }

        return result
    }

    private getBody(Key: string, code?: string): Record<string, Record<string, string>>[string] {
        const Body: Record<string, Record<string, string>> = {
            tokenURL: {
                code: code ?? (() => { throw new Error("Missing CODE. CODE IS REQUIRED"); })(),
                client_id: this.client_id,
                client_secret: this.client_secret,
                redirect_uri: this.redirect_uri,
                grant_type: this.grant_type
            }
        };
    
        if (!Body[Key]) {
            throw new Error(`Unsupported key: ${Key}`);
        }
    
        return Body[Key];
    }

    

    
}