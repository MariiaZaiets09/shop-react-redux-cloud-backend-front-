import * as handlers from './src';

export const getProductById = handlers.getProductByIdHandler();
export const getProductsList = handlers.getProductsListHandler();
export const createProduct = handlers.createProductHandler();
export const catalogBatchProcess = handlers.catalogBatchProcessHandler();
