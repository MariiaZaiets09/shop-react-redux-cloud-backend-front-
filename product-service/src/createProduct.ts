import AWS from 'aws-sdk';
import {errorResponse, successResponse} from './utils/apiResponseBuilder';
import {winstonLogger} from "./utils/winstonLogger";

const dynamoDB = new AWS.DynamoDB.DocumentClient();

export const createProductHandler = () => async (event, _context) => {
  try {
    winstonLogger.logRequest(`Incoming event: ${JSON.stringify(event)}`);

    // Parse product data from the request body
    const productData = JSON.parse(event.body);

    // Validate product data
    if (!productData.id || !productData.title || !productData.description || !productData.price) {
      return successResponse(
        { message: 'Invalid product data' },
        400,
      );
    }

    // Create a new product item in the Products table
    const productParams = {
      TableName: 'products',
      Item: {
        id: productData.id,
        title: productData.title,
        description: productData.description,
        price: productData.price
      }
    };

    // Create a new stock item in the Stocks table with an initial count of 0
    const stockParams = {
      TableName: 'stocks',
      Item: {
        product_id: productData.id,
        count: 0
      }
    };

    // Use batchWrite to ensure atomicity of updates to both tables
    await dynamoDB.batchWrite({
      RequestItems: {
        'products': [{ PutRequest: { Item: productParams.Item } }],
        'stocks': [{ PutRequest: { Item: stockParams.Item } }]
      }
    }).promise();

    return successResponse('Product created successfully');
  } catch (error) {
    return errorResponse(error, 500);
  }
};

