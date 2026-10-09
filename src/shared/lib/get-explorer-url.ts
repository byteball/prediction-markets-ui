import { EXPLORER_URL } from "@/shared/config/env";

export const getExplorerUrl = (type: "address" | "unit", id: string) => (type === "address" ? `${EXPLORER_URL}/address/${id}` : `${EXPLORER_URL}/${id}`);
