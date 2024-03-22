import { getProductByIdHandler } from './getProductById';

describe('getProductById', () => {
    test('getProductById returns 404 for non-existent product', async () => {
        const handler = getProductByIdHandler();
        const event = {
            pathParameters: {
                productId: 'non-existent-id'
            }
        };
        const context = {};

        const response = await handler(event, context);

        expect(response.statusCode).toBe(404);
    });

    test('getProductById returns the correct product for a valid id', async () => {
        const handler = getProductByIdHandler();

        const event = {
            pathParameters: {
                productId: '7567ec4b-b10c-48c5-9345-fc73c48a80aa'
            }
        };
        const context = {};

        const response = await handler(event, context);
        const responseBody = JSON.parse(response.body as string);

        expect(response.statusCode).toBe(200);
        expect(responseBody.productsData.product.id).toBe('7567ec4b-b10c-48c5-9345-fc73c48a80aa');
    });
});
