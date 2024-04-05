import AWS from 'aws-sdk';
import { AttributeMap } from 'aws-sdk/clients/dynamodb';
import { winstonLogger } from './utils/winstonLogger';
import { errorResponse, successResponse } from './utils/apiResponseBuilder';

const dynamoDB = new AWS.DynamoDB();

export const getProductsListHandler = () => async (_event, _context) => {
  try {
    winstonLogger.logRequest('Fetching products and stocks data from DynamoDB...');

    // Fetch products data from DynamoDB
    const productsParams = {
      TableName: process.env.PRODUCTS_TABLE || 'products'
    };
    const productsResult = await dynamoDB.scan(productsParams).promise();
    const productsList = productsResult.Items?.map(item => AWS.DynamoDB.Converter.unmarshall(item));

    // Fetch stocks data from DynamoDB
    const stocksParams = {
      TableName: process.env.STOCKS_TABLE || 'stocks'
    };
    const stocksResult = await dynamoDB.scan(stocksParams).promise();
    const stocksList = stocksResult.Items?.map(item => AWS.DynamoDB.Converter.unmarshall(item));

    // Join products and stocks data
    const mergedList = joinProductsAndStocks(productsList, stocksList);

    winstonLogger.logRequest('Products and stocks data fetched successfully.');
    return successResponse(mergedList);
  } catch (err) {
    winstonLogger.logError(`Error fetching products and stocks data: ${err.message}`);
    return errorResponse(err);
  }
};


// Convert DynamoDB items to a more usable format
const convertDynamoDBItems = (items: AttributeMap[]) => {
  return items.map(item => {
    return Object.entries(item).reduce((acc, [key, value]) => {
      acc[key] = value.S || value.N; // Assume string or number values
      return acc;
    }, {});
  });
};

// Join products and stocks data
const joinProductsAndStocks = (productsList: any[], stocksList: any[]) => {
  // Create a map to store stock counts by product ID
  const stockCountsMap = new Map<string, number>();

  // Populate the stock counts map
  for (const stockItem of stocksList) {
    const productId = stockItem.product_id;
    const count = parseInt(stockItem.count, 10);
    stockCountsMap.set(productId, count);
  }

  // Merge products and stocks data
  const mergedList = productsList.map(product => {
    const productId = product.id;
    const stockCount = stockCountsMap.get(productId) || 0;

    return {
      ...product,
      count: stockCount
    };
  });

  return mergedList;
};

