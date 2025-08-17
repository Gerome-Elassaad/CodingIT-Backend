import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import serverless from 'serverless-http';
declare const handler: serverless.Handler;
export { handler };
export declare const lambdaHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
