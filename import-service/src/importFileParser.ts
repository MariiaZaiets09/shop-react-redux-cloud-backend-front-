import AWS from 'aws-sdk';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { winstonLogger } from './utils/winstonLogger';
import { errorResponse } from './utils/apiResponseBuilder';

const s3 = new AWS.S3();

export const importFileParserHandler = () => async (event) => {
  try {
    // Retrieve the S3 bucket name and object key from the event
    const bucketName = event.Records[0].s3.bucket.name;
    const objectKey = decodeURIComponent(
      event.Records[0].s3.object.key.replace(/\+/g, ' '),
    );

    // Check if the object is located in the 'uploaded' folder
    if (!objectKey.startsWith('uploaded/')) {
      winstonLogger.logRequest(
        `Skipping file ${objectKey} as it is not in the 'uploaded' folder.`,
      );
      return;
    }

    // Get the object from S3
    const s3Object = await s3
      .getObject({ Bucket: bucketName, Key: objectKey })
      .promise();

    const readableStream = new Readable();
    readableStream._read = () => {}; // Required for Readable stream
    readableStream.push(s3Object.Body); // Push S3 object body into the stream
    readableStream.push(null); // Indicate end of data

    // Parse the CSV file using csv-parser
    const records = [];
    readableStream
      .pipe(csvParser())
      .on('data', (data) => records.push(data))
      .on('end', async () => {
        // Log each record to CloudWatch
        winstonLogger.logRequest(`Parsed records: ${records}`);

        // Move the file to the 'parsed' folder
        const newObjectKey = objectKey.replace('uploaded/', 'parsed/');
        await s3
          .copyObject({
            Bucket: bucketName,
            CopySource: `${bucketName}/${objectKey}`,
            Key: newObjectKey,
          })
          .promise();
        await s3.deleteObject({ Bucket: bucketName, Key: objectKey }).promise();
        winstonLogger.logRequest(`File ${objectKey} moved to 'parsed' folder.`);
      });
  } catch (error) {
    winstonLogger.logError(`Error: ${error}`);
    return errorResponse(error, 500);
  }
};
