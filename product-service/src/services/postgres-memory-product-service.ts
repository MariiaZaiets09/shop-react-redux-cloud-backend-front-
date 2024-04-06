import { Client } from 'pg';
import AWS, { SSM } from 'aws-sdk';
import productsData from './products-data.json';
import { winstonLogger } from '../utils/winstonLogger';


AWS.config.update({ region: 'us-east-1' });

const ssm = new SSM();

// Name of the parameter in Parameter Store that contains the PostgreSQL connection URL
const parameterName = '/db/postgres/test';

const getClient = async () => {
  try {
    const parameterValue = await ssm.getParameter({ Name: parameterName, WithDecryption: true }).promise();
    const connectionString = parameterValue.Parameter.Value;

    winstonLogger.logRequest('Retrieved PostgreSQL connection string from Parameter Store.');
    return new Client({ connectionString });
  } catch (error) {
    winstonLogger.logError('Error getting parameter value: ' + error.message);
    throw error;
  }
};

const createTables = async (client) => {
  try {
    await client.connect();

    winstonLogger.logRequest('Creating PostgreSQL tables...');
    await client.query('DROP TABLE IF EXISTS products');
    await client.query('DROP TABLE IF EXISTS stocks');

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        price NUMERIC
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS stocks (
        product_id VARCHAR(255) PRIMARY KEY,
        count INTEGER
      );
    `);

    winstonLogger.logRequest('PostgreSQL tables created successfully.');
    await populateTables(client);
  } catch (error) {
    winstonLogger.logError('Error creating tables: ' + error.message);
    throw error;
  } finally {
    await client.end();
  }
};

const populateTables = async (client) => {
  try {
    winstonLogger.logRequest('Populating PostgreSQL tables...');

    for (const product of productsData) {
      await client.query(`
        INSERT INTO products (id, title, description, price)
        VALUES ($1, $2, $3, $4);
      `, [product.product.id, product.product.title, product.product.description, product.product.price]);

      await client.query(`
        INSERT INTO stocks (product_id, count)
        VALUES ($1, $2);
      `, [product.product.id, product.count]);
    }

    winstonLogger.logRequest('PostgreSQL tables populated successfully!');
  } catch (error) {
    winstonLogger.logError('Error populating tables: ' + error.message);
    throw error;
  }
};

(async () => {
  const client = await getClient();

  try {
    await createTables(client);
    winstonLogger.logRequest('Tables creation and population completed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
})();
