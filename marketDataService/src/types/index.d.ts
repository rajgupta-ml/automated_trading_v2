import { Express } from "express";
export declare global {
    namespace Express {
        interface Request {
            service? : {
                name : String,
                id : String
            }
        }
    }
}