import { ProductsEndpoint } from '.'
import { ClientResponse, ProductProjectionPagedQueryResponse } from '@commercetools/platform-sdk'
import { getSortVariables, normalizeProduct } from '../../../../utils';
import { getLocale } from '../../../../utils';

const getProducts: ProductsEndpoint['handlers']['getProducts'] = async ({
  res,
  body,
  config,
}) => {
  const { search, categoryId, sort } = body;
  const response = await config.sdkFetch<ClientResponse<ProductProjectionPagedQueryResponse>> ({
    query: "productProjections",
    method: "get",
    variables: {
      expand: ["masterData.current"],
      sort: getSortVariables(sort),
      ...(search
        ? { search: { [`text.${getLocale(config)}`]: search } }
        : { }
      ),
      ...(categoryId 
        ? { filters: `categories.id: subtree("${categoryId}")` }
        : { }
      )
    }
  });

  const data = {
    products: response.body.results.map((product) =>
      normalizeProduct(product)
    ),
    found: response.body.count > 0
  }
  res.status(200).json({ data })
}

export default getProducts