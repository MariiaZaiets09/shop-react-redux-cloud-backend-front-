import AWSMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { importProductsFileHandler } from './importProductsFile';

AWSMock.setSDKInstance(AWS);

describe('importProductsFileHandler', () => {
  it('should return a signed URL for a valid name query parameter', async () => {
    const event: APIGatewayProxyEvent = {
      queryStringParameters: {
        name: 'test.csv',
      },
    } as any;

    AWSMock.mock('S3', 'getSignedUrlPromise', Promise.resolve('signed-url'));

    const result = await importProductsFileHandler()(event);

    expect(result).toHaveProperty('statusCode', 200);
    expect(result).toHaveProperty('body');
    expect(JSON.parse(result['body'])).toHaveProperty('url');

    AWSMock.restore('S3');
  });
});
