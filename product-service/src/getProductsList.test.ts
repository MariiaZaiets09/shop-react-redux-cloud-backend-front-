import { ProductDataInterface } from './services/products';
import { getProductsListHandler } from './getProductsList';

describe('getProductsList', () => {
    test('getProductsList returns the correct response shape', async () => {
        const handler = getProductsListHandler();
        const event = {};
        const context = {};

        const response = await handler(event, context);
        const responseBody: any = JSON.parse(response.body as string);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(responseBody)).toBe(true);

        (responseBody as ProductDataInterface[]).forEach(product => {
            expect(product).toHaveProperty('product');
            expect(typeof product.product.id).toBe('string');
            expect(typeof product.product.title).toBe('string');
            expect(typeof product.product.description).toBe('string');
            expect(typeof product.product.price).toBe('number');
            expect(typeof product.count).toBe('number');
        });
    });
});
