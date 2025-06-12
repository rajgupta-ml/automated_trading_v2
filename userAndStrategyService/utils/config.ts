export const config = {
    mode:
        process.env.MODE ||
        (() => {
            throw new Error('Missing MODE in env');
        })(),
    port:
        process.env.PORT ||
        (() => {
            throw new Error('Missing PORT in env');
        })(),

    crypto: {
        secret:
            process.env.CRYPTO_SECRET ||
            (() => {
                throw new Error('Missing CRYPTO SECRET in env');
            })(),
        algorithm:
            process.env.CRYPTO_HSH_ALGO ||
            (() => {
                throw new Error('Missing CRYPTO HASH ALGO in env');
            })(),
    },
    db: {
        uri:
            process.env.DB_URI ||
            (() => {
                throw new Error('Missing DATABASE URI in env');
            })(),
    },

    jwt: {
        secret:
            process.env.JWT_SECRET ||
            (() => {
                throw new Error('Missing JWT_SECRET in env');
            })(),
    },
    redis: {
        uri:
            process.env.REDIS_URI ||
            (() => {
                throw new Error('Missing REDIS_URI in env');
            })(),
    },

    ai: {
        apiKey:
            process.env.GEMINI_API_KEY ||
            (() => {
                throw new Error('Missing GEMINI API KEY in env');
            })(),
    },
};
