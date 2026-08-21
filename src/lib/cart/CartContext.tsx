import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { CartItemView, CartLine, Product, ProductSize } from "@/lib/api/types";

const STORAGE_KEY = "frankys.cart.v1";

interface CartContextValue {
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

const CartContext = createContext<CartContextValue | null>(null);

function loadInitial(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l) =>
        typeof l?.productId === "string" &&
        typeof l?.size === "string" &&
        typeof l?.qty === "number",
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => loadInitial());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const addItem = useCallback((productId: string, size: ProductSize, qty = 1) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === productId && l.size === size);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: Math.min(9, next[idx].qty + qty) };
        return next;
      }
      return [...prev, { productId, size, qty }];
    });
    setIsOpen(true);
    import("@/lib/audio/arcade-audio").then(({ arcadeAudio }) => {
      arcadeAudio.playAddCart();
    });
  }, []);

  const updateQty = useCallback((productId: string, size: ProductSize, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.productId === productId && l.size === size ? { ...l, qty } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const removeItem = useCallback((productId: string, size: ProductSize) => {
    setLines((prev) => prev.filter((l) => !(l.productId === productId && l.size === size)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const buildView = useCallback(
    (products: Product[]): CartItemView[] =>
      lines
        .map((l) => {
          const product = products.find((p) => p.id === l.productId);
          if (!product) return null;
          return {
            ...l,
            product,
            lineTotalCents: product.priceCents * l.qty,
          } satisfies CartItemView;
        })
        .filter((v): v is CartItemView => v !== null),
    [lines],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      itemCount: lines.reduce((n, l) => n + l.qty, 0),
      addItem,
      updateQty,
      removeItem,
      clear,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v),
      buildView,
    }),
    [lines, isOpen, addItem, updateQty, removeItem, clear, buildView],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
