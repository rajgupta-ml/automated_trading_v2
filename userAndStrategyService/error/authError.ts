export class AuthError extends Error {
    constructor(
        public message: string,
        public statusCode: string,
    ) {
        super();
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}
