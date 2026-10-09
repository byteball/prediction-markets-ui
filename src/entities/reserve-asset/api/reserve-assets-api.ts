import { backendHttp } from "@/shared/api/backend-http";

import type { ReserveAssets } from "../model/types";

export const getReserveAssets = async (): Promise<ReserveAssets> => {
  const { data } = await backendHttp.get<ReserveAssets>("/reserve_assets");
  return data;
};
