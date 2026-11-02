import { createContext, useContext } from "react";
import type { CartItemView, CartLine, Product, ProductSize } from "@/lib/api/types";

export interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  addItem: (productId: string, size: ProductSize, qty?: number) => void;
  updateQty: (productId: string, size: ProductSize, qty: number) => void;
  removeItem: (productId: string, size: ProductSize) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  buildView: (products: Product[]) => CartItemView[];
}

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
