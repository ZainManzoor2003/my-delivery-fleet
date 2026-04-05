import { createDeliveriesClient } from "uber-direct/deliveries";
import { logger } from "@/lib/logger";
import { UberAccountType } from "@/lib/enums/uberAccountType";

export class UberServiceError extends Error {
    status: number;
    code: string;
    metadata: Record<string, string> | null;

    constructor(message: string, status: number, code: string, metadata: Record<string, string> | null) {
        super(message);
        this.name = 'UberServiceError';
        this.status = status;
        this.code = code;
        this.metadata = metadata;
    }

    getValidationErrors(): string[] {
        if (!this.metadata) return [this.message];
        return Object.entries(this.metadata).map(([, error]) => {
            const cleanError = error.replace(/^[^:]*:\s*/, '').replace(/^\w/, c => c.toUpperCase());
            return cleanError;
        });
    }
}

async function getUberAccessToken(uberAccountType: UberAccountType) {

    const credentialsMap: Record<UberAccountType, { clientId: string; clientSecret: string; customerId: string }> = {
        [UberAccountType.RESTAURANT]: {
            clientId: process.env.UBER_DIRECT_CLIENT_ID!,
            clientSecret: process.env.UBER_DIRECT_CLIENT_SECRET!,
            customerId: process.env.UBER_DIRECT_CUSTOMER_ID!,
        },
        [UberAccountType.RETAIL]: {
            clientId: process.env.UBER_DIRECT_RETAIL_CLIENT_ID!,
            clientSecret: process.env.UBER_DIRECT_RETAIL_CLIENT_SECRET!,
            customerId: process.env.UBER_DIRECT_RETAIL_CUSTOMER_ID!,
        },
        [UberAccountType.CATERING]: {
            clientId: process.env.UBER_DIRECT_CATERING_CLIENT_ID!,
            clientSecret: process.env.UBER_DIRECT_CATERING_CLIENT_SECRET!,
            customerId: process.env.UBER_DIRECT_CATERING_CUSTOMER_ID!,
        },
    };

    const { clientId, clientSecret, customerId } = credentialsMap[uberAccountType];

    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
        scope: "eats.deliveries",
    });

    const response = await fetch("https://auth.uber.com/oauth/v2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
    });

    if (!response.ok) {
        throw new Error("Failed to get Uber access token");
    }

    const data = await response.json();
    return { accessToken: data.access_token, customerId };
}

class UberService {
    async createQuote(quoteRequest: any, uberAccountType: UberAccountType) {
        const { accessToken, customerId } = await getUberAccessToken(uberAccountType);
        const deliveriesClient = createDeliveriesClient(accessToken, customerId);

        try {
            const response = await deliveriesClient.createQuote(quoteRequest);
            return response;
        } catch (error) {
            const errorDetails = error as any;
            logger.error('Uber createQuote failed', {
                status: errorDetails?.status,
                code: errorDetails?.code,
                message: errorDetails?.message,
                metadata: errorDetails?.metadata,
            });
            throw new UberServiceError(
                errorDetails?.message || 'Unknown Uber API error',
                errorDetails?.status || 500,
                errorDetails?.code || 'unknown_error',
                errorDetails?.metadata || null
            );
        }
    }

    async createDelivery(deliveryRequest: any, uberAccountType: UberAccountType) {
        const { accessToken, customerId } = await getUberAccessToken(uberAccountType);
        const deliveriesClient = createDeliveriesClient(accessToken, customerId);

        try {
            const response = await deliveriesClient.createDelivery(deliveryRequest);
            return response;
        } catch (error) {
            const errorDetails = error as any;
            logger.error('Uber createDelivery failed', {
                status: errorDetails?.status,
                code: errorDetails?.code,
                message: errorDetails?.message,
                metadata: errorDetails?.metadata,
            });
            throw new UberServiceError(
                errorDetails?.message || 'Unknown Uber API error',
                errorDetails?.status || 500,
                errorDetails?.code || 'unknown_error',
                errorDetails?.metadata || null
            );
        }
    }
}

export const uberService = new UberService();
