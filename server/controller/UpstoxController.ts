import type { Request, Response } from 'express';
import { AxiosError } from 'axios';
import type UpstoxManager from '../managers/upstoxManager';

export class UpstoxController {
    constructor(private readonly upstoxClient: UpstoxManager) {}

    getAuthUrl = (req: Request, res: Response) => {
        try {
            const authUrl = this.upstoxClient.getUpstoxAuthUrl();
            res.json({ type: 'success', auth_url: authUrl });
        } catch (error) {
            res.status(401).json({
                type: 'error',
                message: 'Could not get authURL',
            });
        }
    };

    getAccessToken = async (req: Request, res: Response) => {
        try {
            const code = req.query.code as string;
            if (!code)
                res.status(400).json({
                    success: false,
                    message: 'Access Code is missing. malformed Request',
                });

            await this.upstoxClient.getToken(code);
            res.status(200).send('Ok');
        } catch (error) {
            if ((error as AxiosError).isAxiosError) {
                console.error('Axios error:', error);
            }
            res.status(401).json({
                type: 'error',
                message: 'Could not generate the accessToken',
            });
        }
    };

    establishWebsocket = async (req: Request, res: Response) => {
        try {
            await this.upstoxClient.getLastTradingPriceForAllSubscribedStock();
            res.status(200).send('ok');
        } catch (error) {
            console.error(error);
            res.status(500).send('error');
        }
    };

    userSubscribeInstrument = async (req: Request, res: Response) => {
        const user = (req as any).user;
        const instrument_key = req.body.instrument_key as string;

        if (!user) {
            res.status(400).json({
                success: false,
                message: 'Malformed JWT. Please re-login.',
            });
        }

        if (!instrument_key) {
            res.status(400).json({
                success: false,
                message: 'Instrument name is required to subscribe.',
            });
        }

        try {
            await this.upstoxClient.userSubscribeInstrument(
                user.userId,
                instrument_key,
            );

            res.status(200).json({
                success: true,
                message: 'Successfully subscribed to instruments.',
            });
        } catch (error: any) {
            console.error('Subscription error:', error);

            res.status(500).json({
                success: false,
                message:
                    'Failed to subscribe instruments. Please try again later.',
                error: error.message || 'Unknown error',
            });
        }
    };

    getInstrumentsDetails = async (req: Request, res: Response) => {
        try {
            const instrument_name = req.query.instrument_name as string;
            const limit = parseInt(req.query.limit as string) || 5;
            if (!instrument_name) {
                res.status(401).json({
                    status: 'Bad Request',
                    message: 'Instrument name is required',
                });
            }
            const Instument = await this.upstoxClient.getInstrumetnDetails(
                instrument_name,
                limit,
            );
            res.status(200).json({
                success: true,
                instrument: Instument,
            });
        } catch (error) {
            console.error(error);
            res.status(400).json({
                success: false,
            });
        }
    };
}
