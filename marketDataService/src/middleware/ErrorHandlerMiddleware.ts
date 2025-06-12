import type {
    ErrorRequestHandler,
    NextFunction,
    Request,
    Response,
} from 'express';
import { AuthError } from '../error/authError';
import { HttpStatusCode } from '../enums/httpStatusCode';
import { ErrorMessages } from '../enums/message';


type IErr = AuthError | Error
export const errorHandler: ErrorRequestHandler = (
    err: IErr,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    console.error(err);

    if (err instanceof AuthError) {
        console.log(err);
        res.status(err.statusCode).json({
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