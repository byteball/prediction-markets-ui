import axios from "axios";

import { BACKEND_URL } from "@/shared/config/env";

/** Axios instance for the prophet-backend REST API. Entities define the actual requests next to their types. */
export const backendHttp = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
});

export type PaginatedResponse<T, CountKey extends string = "count"> = { data: T[] } & Record<CountKey, number>;
