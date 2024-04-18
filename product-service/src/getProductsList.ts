import { Client } from 'pg';
import { winstonLogger } from './utils/winstonLogger';
import { errorResponse, successResponse } from './utils/apiResponseBuilder';

export const getProductsListHandler = () => async (event, _context) => {
  try {
    winstonLogger.logRequest(
      'Fetching products and stocks data from PostgreSQL...',
    );
    const connectionString = process.env.CONNECTION_STR;

    // Initialize PostgreSQL client
    const client = new Client({
      connectionString,
    });

    // Connect to PostgreSQL
    await client.connect();

    // Fetch products data
    const productsQuery = 'SELECT * FROM products;';
    const productsResult = await client.query(productsQuery);
    const productsList = productsResult.rows;

    // Fetch stocks data
    const stocksQuery = 'SELECT * FROM stocks;';
    const stocksResult = await client.query(stocksQuery);
    const stocksList = stocksResult.rows;

    // Join products and stocks data
    const mergedList = joinProductsAndStocks(productsList, stocksList);

    // Close the PostgreSQL client connection
    await client.end();

    winstonLogger.logRequest('Products and stocks data fetched successfully.');
    return successResponse(mergedList);
  } catch (err) {
    winstonLogger.logError(
      `Error fetching products and stocks data: ${err.message}`,
    );
    return errorResponse(err);
  }
};

const joinProductsAndStocks = (productsList, stocksList) => {
  const stockCountsMap = new Map();
  for (const stockItem of stocksList) {
    stockCountsMap.set(stockItem.product_id, stockItem.count);
  }

  const mergedList = productsList.map((product) => {
    const productId = product.id;
    const stockCount = stockCountsMap.get(productId) || 0;
    return {
      ...product,
      count: stockCount,
    };
  });

  return mergedList;
};
