import AWS from 'aws-sdk';
import { winstonLogger } from './utils/winstonLogger';
import { errorResponse, successResponse } from './utils/apiResponseBuilder';

const dynamoDB = new AWS.DynamoDB();

export const getProductByIdHandler = () => async (event, _context) => {
  try {
    winstonLogger.logRequest(`Incoming event: ${JSON.stringify(event)}`);

    const { productId = '' } = event.pathParameters;

    // Retrieve product data from DynamoDB
    const params = {
      TableName: 'products', // Replace 'products' with your DynamoDB table name
      Key: {
        'id': { S: productId },
      },
    };

    const productData = await dynamoDB.getItem(params).promise();

    if (!productData.Item) {
      return successResponse(
        { message: `Product with id ${productId} not found` },
        404,
      );
    }

    const product = {
      id: productData.Item.id.S,
      title: productData.Item.title.S,
      description: productData.Item.description.S,
      price: parseFloat(productData.Item.price.N),
    };

    winstonLogger.logRequest(
      `"Received product with id: ${productId}: ${JSON.stringify(product)}`,
    );

    return successResponse({ product });
  } catch (err) {
    return errorResponse(err);
  }
};
