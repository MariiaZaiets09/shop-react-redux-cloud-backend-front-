export interface ProductDetailsInterface {
    id: string,
    title: string,
    description: string,
    price: number,
}

export interface ProductDataInterface {
    product: ProductDetailsInterface,
    count: number,
}

export interface ProductServiceAPIInterface {
    getProductById: (id: string) => Promise<ProductDataInterface>,
    getProductsList: () => Promise<ProductDataInterface[]>,
}
