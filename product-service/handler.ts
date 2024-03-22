import * as handlers from './src';

console.log(process.env);

export const getProductById = handlers.getProductByIdHandler();
export const getProductsList = handlers.getProductsListHandler();
