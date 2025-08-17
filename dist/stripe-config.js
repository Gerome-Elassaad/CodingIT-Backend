"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductById = exports.getProductByPriceId = exports.STRIPE_PRODUCTS = void 0;
exports.STRIPE_PRODUCTS = {
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
const getProductByPriceId = (priceId) => {
    return Object.values(exports.STRIPE_PRODUCTS).find(product => product.priceId === priceId);
};
exports.getProductByPriceId = getProductByPriceId;
const getProductById = (id) => {
    return exports.STRIPE_PRODUCTS[id];
};
exports.getProductById = getProductById;
//# sourceMappingURL=stripe-config.js.map