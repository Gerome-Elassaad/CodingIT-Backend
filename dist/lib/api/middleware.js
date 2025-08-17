"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublicApiRoute = createPublicApiRoute;
exports.createProtectedApiRoute = createProtectedApiRoute;
exports.createRateLimitedApiRoute = createRateLimitedApiRoute;
function createPublicApiRoute(handler, options) {
    return async (req, res, next) => {
        try {
            await handler({ request: req, response: res });
        }
        catch (error) {
            next(error);
        }
    };
}
function createProtectedApiRoute(handler, options) {
    return async (req, res, next) => {
        try {
            await handler({ request: req, response: res });
        }
        catch (error) {
            next(error);
        }
    };
}
function createRateLimitedApiRoute(handler, rateLimitOptions, options) {
    return async (req, res, next) => {
        try {
            await handler({ request: req, response: res });
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=middleware.js.map