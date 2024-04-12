import { Client } from 'pg';
import { winstonLogger } from './utils/winstonLogger';
import { errorResponse, successResponse } from './utils/apiResponseBuilder';

export const getProductByIdHandler = () => async (event, _context) => {
  try {
    winstonLogger.logRequest(`Incoming event: ${JSON.stringify(event)}`);

    const { productId = '' } = event.pathParameters;
    const connectionString = process.env.CONNECTION_STR;

    // Initialize PostgreSQL client
    const client = new Client({
      connectionString,
    });

    // Connect to PostgreSQL
    await client.connect();

    // Retrieve product data from PostgreSQL
    const productQuery = 'SELECT * FROM products WHERE id = $1;';
    const productResult = await client.query(productQuery, [productId]);

    // Close the PostgreSQL client connection
    await client.end();

    if (productResult.rows.length === 0) {
      return successResponse(
        { message: `Product with id ${productId} not found` },
        404,
      );
    }

    const product = productResult.rows[0]; // Assuming id is unique, there should be only one match

    winstonLogger.logRequest(
      `Received product with id: ${productId}: ${JSON.stringify(product)}`,
    );

    return successResponse({ product });
  } catch (err) {
    winstonLogger.logError(`Error fetching product by ID: ${err.message}`);
    return errorResponse(err);
  }
};
