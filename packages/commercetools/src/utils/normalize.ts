import { ProductOption } from '../types/product'
import { Category } from '../types/site'
import { 
  ProductProjection,
  Image,
  ProductVariant,
  Category as CommercetoolsCategory,
  Cart as CommercetoolsCart,
  LineItem as CommercetoolsLineItem,
  TypedMoney,
  Customer,
  ShoppingList,
  ProductData
} from '@commercetools/platform-sdk'
import { dedup, withoutNils } from './common'

const locale = "en";
const currencyCode = "USD";

const stringify = (value: any) => 
  typeof value === "string" ? value : JSON.stringify(value)


const money = (price: TypedMoney | undefined) => {
  return price ? {
    value: price.centAmount/100,
    currencyCode: price.currencyCode,
  } : {
    value: -1.00, // error
    currencyCode
  }
}

const normalizeProductOption = (
  option: {
    name: string,
    value: string | string[]
  }
): ProductOption => ({
  __typename: "MultipleChoiceOption",
  id: option.name,
  displayName: option.name,
  values: dedup(Array.isArray(option.value) ? option.value : [option.value]).map(val => ({
    label: stringify(val)
  }))
})

const normalizeProductImages = (images: Image[]) =>
  images.map(image => ({
    url: image.url,
    ...(image.label ? { alt: image.label } : { }),
    width: image.dimensions.w,
    height: image.dimensions.h
  }))

const normalizeProductVariant = (variant: ProductVariant) => {
  const price = money(
    variant.prices?.find(price => price.value.currencyCode === currencyCode)?.value ??
    variant.prices?.[0]?.value
  ).value;

  return ({
    id: `${variant.id}`,
    name: `${variant.id}`,
    sku: variant.sku ?? "",
    price,
    options: variant.attributes?.map(attribute => normalizeProductOption(attribute)) ?? [],
    requiresShipping: false,
    listPrice: price,
  });
}

export const normalizeProduct = (
  product: ProductProjection | (ProductData & { id: string })
) => ({
  id: product.id,
  name: product.name[locale],
  slug: product.slug[locale],
  path: `/${product.slug[locale]}`,
  description: product.description?.[locale] ?? "",
  price: money(
    product.masterVariant.prices?.find(
      price => price.value.currencyCode === currencyCode
    )?.value ?? product.masterVariant.prices?.[0]?.value
  ),
  images: normalizeProductImages(
    withoutNils(
      [...(
        product.masterVariant.images 
          ? product.masterVariant.images
          : []
      ),
      ...product.variants.flatMap(
          variant => variant.images
        )
      ]
    )
  ),
  variants: [product.masterVariant, ...product.variants].map(normalizeProductVariant),
  options: withoutNils([
    ...(
        product.masterVariant.attributes 
          ? product.masterVariant.attributes 
          : []
    ),
    ...product.variants.flatMap(variant => variant.attributes)
  ]).reduce(
    (groupedAttributes, attribute) => {
      const groupedAttribute = groupedAttributes.find(gAttr => gAttr.name === attribute.name);
      if (groupedAttribute) {
        groupedAttribute.value.push(stringify(attribute.value))
      } else {
        groupedAttributes.push({
          name: attribute.name,
          value: [stringify(attribute.value)]
        })
      }
      return groupedAttributes;
    }
  , [] as {
    name: string;
    value: string[];
  }[]).map(normalizeProductOption)
})

const normalizeLineItem = (
  lineItem: CommercetoolsLineItem
) => ({
  id: lineItem.id,
  variantId: `${lineItem.variant.id}`,
  productId: lineItem.productId,
  name: lineItem.name[locale],
  path: "",
  quantity: lineItem.quantity,
  discounts: [],
  variant: normalizeProductVariant(lineItem.variant),
  options: lineItem.variant.attributes?.map(attribute => ({
    id: attribute.name,
    name: attribute.name,
    value: stringify(attribute.value)
  })) ?? [],
});

export const normalizeCart = (
  cart: CommercetoolsCart
) => ({
  id: cart.id,
  customerId: cart.customerId,
  email: cart.customerEmail,
  createdAt: cart.createdAt,
  currency: {
      code: currencyCode
  },
  taxesIncluded: cart.taxMode !== "Disabled",
  lineItems: cart.lineItems.map(normalizeLineItem),
  lineItemsSubtotalPrice: 0,
  subtotalPrice: money(cart.totalPrice).value,
  totalPrice: money(cart.totalPrice).value,
  discounts: [],

});

export const normalizeCategory = (category: CommercetoolsCategory): Category => ({
  id: category.id,
  name: category.name[locale],
  slug: category.slug[locale],
  path: `/${category.slug[locale]}`,
});

export const normalizeCustomer = (customer: Customer) => ({
  firstName: customer.firstName,
  lastName: customer.lastName,
  email: customer.email
})

export const normalizeWishlist = (wishlist: ShoppingList ) => ({
  items: wishlist.lineItems?.map(item => ({
    id: item.id,
    product_id: item.productId,
    variant_id: item.variantId!
  })) ?? []
})