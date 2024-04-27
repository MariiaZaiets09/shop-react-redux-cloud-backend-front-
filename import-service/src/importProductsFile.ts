import AWS from 'aws-sdk';
import { winstonLogger } from './utils/winstonLogger';
import { errorResponse } from './utils/apiResponseBuilder';

const s3 = new AWS.S3();

export const importProductsFileHandler = () => async (event) => {
  const name = event.queryStringParameters
    ? event.queryStringParameters.name
    : null;
  if (!name) {
    return winstonLogger.logError('Missing "name" query parameter');
  }

  const params = {
    Bucket: 'uploaded-mariiazaiets',
    Key: `uploaded/${name}`,
    Expires: 60, // Link expiration time in seconds
    ContentType: 'text/csv',
  };

  try {
    const signedUrl = await s3.getSignedUrlPromise('putObject', params);
    winstonLogger.logRequest(`Signed URL generated successfully for ${name}`);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ url: signedUrl }),
    };
  } catch (error) {
    winstonLogger.logError(`Error generating signed URL: ${error}`);
    return errorResponse(error, 500);
  }
};
