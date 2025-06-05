import { connectToRedis } from "../utils/redis"

export const exactMatchSearch = async (query : string) : Promise<string[]> => {
    const client = await connectToRedis();

    try{
        const lowerQuery = query.toLowerCase().trim();
        const exactMatches = await Promise.all([client.get(`exact_name:${lowerQuery}`), client.get(`exact_key:${lowerQuery}`)]);
        return exactMatches.filter(Boolean) as string[]; 
    }finally{
        client.quit()
    }
}



export const prefixSearch = async (query : string, limit: number = 10) : Promise<string[]> => {
    const client = await connectToRedis();

    try {
        const lowerQuery = query.toLowerCase().trim();
        if(lowerQuery.length < 2) return [];

        const instrument = await client.zRange(
            `prefix:${lowerQuery}`,
            0,
            limit - 1,
        )
        return instrument;
    }catch(error){
        return []
    }finally{
        client.quit();
    }
}
