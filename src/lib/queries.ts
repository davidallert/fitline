import { queryOptions } from "@tanstack/react-query";
import { getCategories, getProduct, getProducts } from "./catalog.functions";

export const categoriesQuery = () =>
  queryOptions({ queryKey: ["categories"], queryFn: () => getCategories() });

export const productsQuery = (featured = false) =>
  queryOptions({ queryKey: ["products", { featured }], queryFn: () => getProducts({ data: { featured } }) });

export const productQuery = (slug: string) =>
  queryOptions({ queryKey: ["product", slug], queryFn: () => getProduct({ data: { slug } }) });
