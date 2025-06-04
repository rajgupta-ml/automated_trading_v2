export const config = {
    mode : process.env.MODE || (() => {throw new Error("Missing MODE in env")})(),
    access_code : process.env.ACCESS_CODE,

    port : process.env.PORT || (() => {throw new Error("Missing PORT in env")})(),
    upstox : {
        client_id : process.env.CLIENT_ID || (() => {throw new Error("Missing CLIENT_ID in env")})(),
        client_secret : process.env.CLIENT_SECRET || (() => {throw new Error("Missing CLIENT_SECRET in env")})(),

        redirect_uri : process.env.REDIRECT_URI || (() => {throw new Error("Missing REDIRECT_URI in env")})(),
    },

    crypto : {
        secret : process.env.CRYPTO_SECRET || (() => {throw new Error("Missing CRYPTO SECRET in env")})(),
        algorithm : process.env.CRYPTO_HSH_ALGO || (() => {throw new Error("Missing CRYPTO HASH ALGO in env")})()
    },

    db : {
        uri : process.env.DB_URI || (() => {throw new Error("Missing DATABASE URI in env")})(),
    },

    jwt : {
        secret : process.env.JWT_SECRET || (() => {throw new Error("Missing JWT_SECRET in env")})(),
    },
    redis : {
        uri : process.env.REDIS_URI || (() => {throw new Error("Missing REDIS_URI in env")})(),
    }
}