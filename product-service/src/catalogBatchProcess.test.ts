import { catalogBatchProcessHandler } from './catalogBatchProcess';
import { successResponse } from './utils/apiResponseBuilder';
import { Client } from 'pg';

describe('catalogBatchProcessHandler', () => {
  test('should process catalog batch successfully', async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            id: '1',
            title: 'Product 1',
            description: 'Description 1',
            price: 10,
            count: 5,
          }),
        },
        {
          body: JSON.stringify({
            id: '2',
            title: 'Product 2',
            description: 'Description 2',
            price: 20,
            count: 10,
          }),
        },
      ],
    };

    const context = {};

    const mockClient = {
      connect: jest.fn(),
      query: jest.fn().mockResolvedValueOnce({}),
      end: jest.fn(),
    };

    jest
      .spyOn(Client.prototype, 'connect')
      .mockImplementation(mockClient.connect);
    jest.spyOn(Client.prototype, 'query').mockImplementation(mockClient.query);
    jest.spyOn(Client.prototype, 'end').mockImplementation(mockClient.end);

    const response = await catalogBatchProcessHandler()(event, context);

    expect(mockClient.connect).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalledTimes(4);
    expect(mockClient.end).toHaveBeenCalledTimes(1);
    expect(response).toEqual(
      successResponse({ message: 'Batch processed successfully.' }),
    );
  });
});
