import { ConfigError } from "../error/configError";

export const config = {
    express : {
        port : process.env.PORT || (() => {
            throw new ConfigError('Missing PORT in env');
        })(),

    },
    jwt : {
        secret : process.env.SECRET || (() => {
            throw new ConfigError('Missing JWT SECRET in env');
        })(), 
        expiresIn : "1d"
    },
    service : {
        name : process.env.SERVICE_NAME || (() => {
            throw new ConfigError('Missing SERVICE NAME in env');
        })(),
        
        id : process.env.SERVICE_ID || (() => {
            throw new ConfigError('Missing SERVICE ID in env');
        })(),
    }
}