import { Client } from 'pg';
import { errorResponse, successResponse } from './utils/apiResponseBuilder';
import { winstonLogger } from './utils/winstonLogger';
import { v4 as uuidv4 } from 'uuid';

export const createProductHandler = () => async (event, _context) => {
  winstonLogger.logRequest(`Incoming request: ${event.body}`);

  let productData;
  try {
    productData = JSON.parse(event.body);
  } catch (err) {
    winstonLogger.logError('Invalid JSON format');
    return errorResponse(err, 400);
  }

  // Validate product data (excluding ID validation for creation)
  if (
    !productData.title ||
    !productData.description ||
    typeof productData.price !== 'number' ||
    typeof productData.count !== 'number'
  ) {
    return successResponse({ message: 'Invalid product data' }, 400);
  }

  const id = productData.id || uuidv4(); // Generate ID if not provided

  const connectionString = process.env.CONNECTION_STR;
  const client = new Client({ connectionString });

  try {
    await client.connect();
    await client.query('BEGIN');

    // Upsert Product Data
    const productUpsertQuery = `
            INSERT INTO products (id, title, description, price)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE
            SET title = $2, description = $3, price = $4
            RETURNING id;`;
    await client.query(productUpsertQuery, [
      id,
      productData.title,
      productData.description,
      productData.price,
    ]);

    // Upsert Stock Data (Assuming 'product_id' is a unique constraint in 'stocks' table)
    const stockUpsertQuery = `
            INSERT INTO stocks (product_id, count)
            VALUES ($1, $2)
            ON CONFLICT (product_id) DO UPDATE
            SET count = $2;`;
    await client.query(stockUpsertQuery, [id, productData.count]);

    await client.query('COMMIT');

    winstonLogger.logRequest('Product and stock data processed successfully.');
    return successResponse(
      { message: 'Product processed successfully', id },
      201,
    );
  } catch (err) {
    await client.query('ROLLBACK');
    winstonLogger.logError(`Error processing product: ${err.message}`);
    return errorResponse(err, 500);
  } finally {
    await client.end();
  }
};
