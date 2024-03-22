import { winstonLogger } from './utils/winstonLogger';
import { errorResponse, successResponse } from './utils/apiResponseBuilder';
import productsData from './services/products-data.json';

export const getProductsListHandler = () => async (event, _context) => {
    try {
        winstonLogger.logRequest(`Incoming event: ${JSON.stringify(event)}`);
        winstonLogger.logRequest(`"Received products: ${JSON.stringify(productsData)}`);
        return successResponse(productsData);
    }
    catch (err) {
        return errorResponse( err );
    }
};
