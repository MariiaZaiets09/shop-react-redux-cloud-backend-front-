import { Client } from 'pg';
import { winstonLogger } from './utils/winstonLogger';
import { errorResponse, successResponse } from './utils/apiResponseBuilder';
import { v4 as uuidv4 } from 'uuid';

export const catalogBatchProcessHandler = () => async (event, _context) => {
  winstonLogger.logRequest('Starting to process catalog batch from SQS...');

  console.log('Event:', event);

  const connectionString = process.env.CONNECTION_STR;
  console.log('Connection String:', connectionString);
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();

    for (const record of event.Records) {
      const product = JSON.parse(record.body);
      console.log('Product:', product);

      if (
        !product ||
        !product.title ||
        !product.description ||
        typeof product.price !== 'number' ||
        typeof product.count !== 'number'
      ) {
        // Returning a response with a 400 status code for invalid product data
        return successResponse({ message: 'Invalid product data' }, 400);
      }

      const { title, description, price } = product;
      const count = product.count || 0;
      const id = product.id || uuidv4();

      // Upsert Product Data
      const productUpsertQuery = `
        INSERT INTO products (id, title, description, price)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
        SET title = $2, description = $3, price = $4
        RETURNING id;`;

      const values = [id, title, description, price, count];
      await client.query(productUpsertQuery, values);
      winstonLogger.logRequest(`Product inserted successfully: ${title}`);

      const stockUpsertQuery = `
        INSERT INTO stocks (product_id, count)
        VALUES ($1, $2)
        ON CONFLICT (product_id) DO UPDATE
        SET count = $2;`;

      await client.query(stockUpsertQuery, [id, count]);
      winstonLogger.logRequest(
        'Product and stock data processed successfully.',
      );
    }

    await client.end();
    winstonLogger.logRequest(
      'All products processed and inserted successfully.',
    );

    // Returning a success response after processing all records
    return successResponse({ message: 'Batch processed successfully.' });
  } catch (err) {
    // Logging the error and returning an error response
    winstonLogger.logError(`Error while processing batch: ${err.message}`);
    await client.end();
    return errorResponse(err);
  }
};
