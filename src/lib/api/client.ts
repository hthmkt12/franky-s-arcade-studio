// Thin fetch wrapper. Today every shop endpoint is mocked (see ./shop.ts),
// but real endpoints will route through this client so swapping the
// implementation is a single-line change per endpoint.
//
// Backend contract (future REST):
//   GET    /api/products
//   GET    /api/products/:slug
//   POST   /api/orders            body: OrderDraft -> Order
//   GET    /api/orders/:id
//
// Server route files should live at src/routes/api/* (TanStack Start).

import type { ApiError } from "./types";

const BASE_URL = "/api";

export class ApiException extends Error {
  code: string;
  status: number;
  constructor(error: ApiError, status: number) {
    super(error.message);
    this.code = error.code;
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    let payload: ApiError = { code: "unknown", message: res.statusText };
    try {
      payload = (await res.json()) as ApiError;
    } catch {
      /* ignore */
    }
    throw new ApiException(payload, res.status);
  }
  return (await res.json()) as T;
}

/** Simulate network latency for the mock API. */
export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
