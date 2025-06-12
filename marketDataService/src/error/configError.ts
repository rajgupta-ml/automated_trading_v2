export class ConfigError extends Error {
    constructor(
        public message: string,
    ) {
        super();
        Object.setPrototypeOf(this, ConfigError.prototype);
    }
}
