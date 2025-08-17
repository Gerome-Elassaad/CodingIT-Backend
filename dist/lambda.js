"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lambdaHandler = exports.handler = void 0;
const serverless_http_1 = __importDefault(require("serverless-http"));
const serverless_1 = __importDefault(require("./serverless"));
// Create serverless handler for AWS Lambda
const handler = (0, serverless_http_1.default)(serverless_1.default, {
    binary: false,
    request: (request, event, context) => {
        // Add Lambda-specific request modifications here if needed
        request.serverless = {
            event,
            context,
            provider: 'aws-lambda'
        };
    },
    response: (response, event, context) => {
        // Add Lambda-specific response modifications here if needed
        response.headers = {
            ...response.headers,
            'X-Serverless-Provider': 'aws-lambda',
            'X-Request-ID': context.awsRequestId
        };
    }
});
exports.handler = handler;
// Alternative export for compatibility
const lambdaHandler = async (event, context) => {
    try {
        return await handler(event, context);
    }
    catch (error) {
        console.error('Lambda handler error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            body: JSON.stringify({
                error: 'Internal Server Error',
                timestamp: new Date().toISOString(),
                requestId: context.awsRequestId
            })
        };
    }
};
exports.lambdaHandler = lambdaHandler;
//# sourceMappingURL=lambda.js.map