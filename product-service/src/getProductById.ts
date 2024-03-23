import { winstonLogger } from './utils/winstonLogger';
import { errorResponse, successResponse } from './utils/apiResponseBuilder';
import products from './services/products-data.json';

export const getProductByIdHandler = () => async (event, _context) => {
  try {
    winstonLogger.logRequest(`Incoming event: ${JSON.stringify(event)}`);

    const { productId = '' } = event.pathParameters;
    const productsData = products.find(
      (product) => product.product.id === productId,
    );

    if (!productsData) {
      return successResponse(
        { message: `Product with id ${productId} not found` },
        404,
      );
    }

    winstonLogger.logRequest(
      `"Received product with id: ${productId}: ${JSON.stringify(productsData)}`,
    );

    return successResponse({ productsData });
  } catch (err) {
    return errorResponse(err);
  }
};
