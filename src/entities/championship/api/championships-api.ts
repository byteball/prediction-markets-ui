import { backendHttp } from "@/shared/api/backend-http";

import type { Championships } from "../model/types";

export const getChampionships = async (): Promise<Championships> => {
  const { data } = await backendHttp.get<Championships>("/championships");
  return data;
};
