import { useCallback } from 'react'
import type {
  MutationHookContext,
  HookFetcherContext,
} from '@vercel/commerce/utils/types'
import useRemoveItem, {
  UseRemoveItem,
} from '@vercel/commerce/cart/use-remove-item'
import type {
  LineItem,
  RemoveItemHook,
} from '@vercel/commerce/types/cart'
import useCart from './use-cart'
import { Cart } from '@commercetools/platform-sdk';

export type RemoveItemFn<T = any> = T extends LineItem
  ? (input?: RemoveItemActionInput<T>) => Promise<Cart | null | undefined>
  : (input: RemoveItemActionInput<T>) => Promise<Cart | null>

export type RemoveItemActionInput<T = any> = T extends LineItem
  ? Partial<RemoveItemHook['actionInput']>
  : RemoveItemHook['actionInput']

export default useRemoveItem as UseRemoveItem<typeof handler>

export const handler = {
  fetchOptions: {
    url: '/api/cart',
    method: 'delete',
  },
  async fetcher({
    input: { itemId },
    options,
    fetch,
  }: HookFetcherContext<RemoveItemHook>) {
    return await fetch({
      ...options,
      body: { itemId },
    })
  },
  useHook:
    ({ fetch }: MutationHookContext<RemoveItemHook>) =>
    () => {
      const { mutate } = useCart()

      return useCallback(
        async function removeItem(input) {
          const data = await fetch({ input: { itemId: input.id } })
          await mutate(data, false)

          return data
        },
        [fetch, mutate]
      )
    },
}
