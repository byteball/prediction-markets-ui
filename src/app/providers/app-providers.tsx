import type { ReactNode } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Provider as StoreProvider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { SWRConfig } from "swr";
import axios from "axios";

import { TooltipProvider } from "@/shared/ui/tooltip";
import { Toaster } from "@/shared/ui/sonner";

import { persistor, store } from "../store";

const swrFetcher = (url: string) => axios.get(url).then((res) => res.data);

/** Every app-wide provider, outermost first: store, persistence gate, head management, SWR, tooltips, toasts. */
export const AppProviders = ({ children }: { children: ReactNode }) => (
  <StoreProvider store={store}>
    <HelmetProvider>
      <PersistGate loading={null} persistor={persistor}>
        <SWRConfig value={{ fetcher: swrFetcher }}>
          <TooltipProvider delayDuration={100}>
            {children}
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </SWRConfig>
      </PersistGate>
    </HelmetProvider>
  </StoreProvider>
);
