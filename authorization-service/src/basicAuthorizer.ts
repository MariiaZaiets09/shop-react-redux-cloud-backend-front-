import { APIGatewayAuthorizerResult } from 'aws-lambda';
import { errorResponse, successResponse, winstonLogger } from './utils';

export const basicAuthorizerHandler = () => async (event, _context) => {
  try {
    // Extract authorization header from the event
    const authorizationHeader = event.authorizationToken;

    // Check if Authorization header exists
    if (!authorizationHeader) {
      successResponse({ message: 'Authorization header is not provided' }, 401);
      return generatePolicy('user', 'Deny', event.methodArn);
    }

    // Extract credentials from the Authorization header
    const encodedCredentials = authorizationHeader.split(' ')[1];
    const decodedCredentials = Buffer.from(
      encodedCredentials,
      'base64',
    ).toString('utf-8');
    const [username, password] = decodedCredentials.split(':');
    const formattedUsername = username.replace('_', '-');

    // Check if credentials match the environment variables
    const expectedPassword = process.env[formattedUsername];
    if (!expectedPassword || expectedPassword !== password) {
      successResponse({ message: 'Access is denied for this user' }, 403);
      return generatePolicy('user', 'Deny', event.methodArn);
    }

    // Return allow policy if credentials are valid
    winstonLogger.logRequest('Authorization successful');
    return generatePolicy(formattedUsername, 'Allow', event.methodArn);
  } catch (error) {
    // Return 500 error for any unexpected errors
    errorResponse(error, 500);
    throw new Error('Unauthorized');
  }
};

const generatePolicy = (
  principalId: string,
  effect: string,
  resource: string,
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
};
