export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  mode: 'payment' | 'subscription';
}

export const STRIPE_PRODUCTS: Record<string, StripeProduct> = {
  'pro-plan-monthly': {
    id: 'prod_SsmJy2XZp7bsVv',
    priceId: 'price_1Rx0l5H9eqg6cvCREX7AOwFH',
    name: 'Pro Plan',
    description: 'Advanced features and unlimited access',
    price: 89.99,
    mode: 'subscription'
  },
  'pro-plan-basic': {
    id: 'prod_Ssm6LYMAkmzNSC',
    priceId: 'price_1Rx0Y5H9eqg6cvCR8CyjbzOt',
    name: 'Pro plan',
    description: 'Essential features for professionals',
    price: 9.99,
    mode: 'subscription'
  }
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return Object.values(STRIPE_PRODUCTS).find(product => product.priceId === priceId);
};

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS[id];
};