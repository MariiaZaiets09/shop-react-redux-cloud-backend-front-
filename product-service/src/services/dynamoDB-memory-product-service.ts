import AWS from 'aws-sdk';
import productsData from './products-data.json';
import { winstonLogger } from '../utils/winstonLogger';

AWS.config.update({ region: 'us-east-1' });

const dynamoDB = new AWS.DynamoDB();

const populateTables = async () => {
  try {
    winstonLogger.logRequest('Creating DynamoDB tables...');
    await createTable('products', 'id');
    await createTable('stocks', 'product_id');

    winstonLogger.logRequest('Waiting for tables to be active...');
    await waitForTables();

    winstonLogger.logRequest('Populating products and stocks tables...');
    await populateProductsTable();
    await populateStocksTable();

    winstonLogger.logRequest('Tables populated successfully!');
  } catch (error) {
    winstonLogger.logError('Error populating tables: ' + error.message);
    throw error; // Re-throw the error to propagate it
  }
};

const createTable = async (tableName: string, partitionKey: string) => {
  const params = {
    TableName: tableName,
    KeySchema: [{ AttributeName: partitionKey, KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: partitionKey, AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  };

  await dynamoDB.createTable(params).promise();
};

const waitForTables = async () => {
  await dynamoDB.waitFor('tableExists', { TableName: 'products' }).promise();
  await dynamoDB.waitFor('tableExists', { TableName: 'stocks' }).promise();
};

const populateProductsTable = async () => {
  const params = {
    RequestItems: {
      'products': productsData.map(product => ({
        PutRequest: {
          Item: {
            'id': { S: product.product.id },
            'title': { S: product.product.title },
            'description': { S: product.product.description },
            'price': { N: String(product.product.price) },
          },
        },
      })),
    },
  };

  await dynamoDB.batchWriteItem(params).promise();
};

const populateStocksTable = async () => {
  const params = {
    RequestItems: {
      'stocks': productsData.map(product => ({
        PutRequest: {
          Item: {
            'product_id': { S: product.product.id },
            'count': { N: String(product.count) },
          },
        },
      })),
    },
  };

  await dynamoDB.batchWriteItem(params).promise();
};

(async () => {
  try {
    await populateTables(); // Wait for populateTables to complete
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1); // Exit with a non-zero code to indicate failure
  }
})();
