export interface StripeProduct {
    id: string;
    priceId: string;
    name: string;
    description: string;
    price: number;
    mode: 'payment' | 'subscription';
}
export declare const STRIPE_PRODUCTS: Record<string, StripeProduct>;
export declare const getProductByPriceId: (priceId: string) => StripeProduct | undefined;
export declare const getProductById: (id: string) => StripeProduct | undefined;
