// handlers/errorHandler.ts

import type {
    ErrorRequestHandler,
    NextFunction,
    Request,
    Response,
} from 'express';
import { ApiError } from '../error/apiError';
import { HttpStatusCode } from '../utils/httpStatusCode';
import { ErrorMessages } from '../enums/messages';

export const errorHandler: ErrorRequestHandler = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    console.error(err);

    if (err instanceof ApiError) {
        res.status(parseInt(err.statusCode, 10)).json({
            success: false,
            message: err.message,
            statusCode: err.statusCode,
        });
    } else if (err instanceof Error) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR as any as number).json({
            success: false,
            message: ErrorMessages.INTERNAL_SERVER_ERROR,
            statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        });
    } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR as any as number).json({
            success: false,
            message: ErrorMessages.GENERIC_ERROR,
            statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        });
    }
};
