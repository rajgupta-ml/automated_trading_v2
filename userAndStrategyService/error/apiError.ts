export class ApiError extends Error {
    constructor(
        public message: string,
        public statusCode: string,
    ) {
        super();
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
