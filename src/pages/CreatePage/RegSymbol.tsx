import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import { isBoolean } from "lodash";
import { useSelector } from "react-redux";
import moment from "moment";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";

import client from "services/obyte";
import { QRButton } from "components/QRButton/QRButton";
import { generateLink, generateTextEvent } from "utils";
import { useWindowSize } from "hooks";
import type { RootState } from "store/hooks";

import appConfig from "appConfig";

import { Button } from "@/components/ui/button";
import { FormItem } from "@/components/ui/form-item";
import { Input } from "@/components/ui/input";
import { InputGroup } from "@/components/ui/input-group";
import { Steps } from "@/components/ui/steps";
import { Textarea } from "@/components/ui/textarea";

const initStateValue = {
  value: "",
  valid: false,
};

const tokenRegistry: string = client.api.getOfficialTokenRegistryAddress();

type CreationOrder = {
  yes_asset?: string;
  no_asset?: string;
  draw_asset?: string;
  yes_symbol?: string;
  no_symbol?: string;
  draw_symbol?: string;
  yes_symbol_req?: boolean;
  no_symbol_req?: boolean;
  draw_symbol_req?: boolean;
  data: { oracle: string; feed_name: string; event_date: string; reserve_decimals: number; datafeed_value: string | number; comparison: string; yes_team?: string; no_team?: string } & Record<string, unknown>;
} & Record<string, unknown>;

// Not mounted by any route at the moment (CreatePage imports it commented out); kept in sync with the
// antd → shadcn migration so the module still type-checks and builds.
export const RegisterSymbols = () => {
  const order = useSelector((state: RootState) => (state as unknown as { settings: { creationOrder: CreationOrder } }).settings.creationOrder);

  let initCurrentStep = 0;

  if (order.yes_asset && !order.yes_symbol) {
    initCurrentStep = 0;
  } else if (order.no_asset && !order.no_symbol) {
    initCurrentStep = 1;
  } else if (order.draw_asset && !order.draw_symbol) {
    initCurrentStep = 2;
  }

  const [width] = useWindowSize();
  const [currentStep, setCurrentStep] = useState(initCurrentStep);
  const currentSymbol = initCurrentStep === 0 ? "yes" : initCurrentStep === 1 ? "no" : "draw";

  const [isAvailable, setIsAvailable] = useState<boolean | null | undefined>(undefined);
  const [symbolByCurrentAsset, setSymbolByCurrentAsset] = useState<string | null | undefined>(undefined);
  const [token, setToken] = useState(initStateValue);
  const [tokenSupport, setTokenSupport] = useState(initStateValue);
  const [descr, setDescr] = useState(initStateValue);

  const checkRef = useRef<HTMLButtonElement>(null);
  const regRef = useRef<HTMLAnchorElement>(null);

  const isSportMarket = !!appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === order.data.oracle);
  const currentAsset = order[currentSymbol + "_asset"] as string;

  let yes_team: string | undefined;
  let no_team: string | undefined;

  if (isSportMarket) {
    const split = order.data.feed_name.split("_");
    yes_team = split[1];
    no_team = split[2];
  }

  useEffect(() => {
    if (!order.yes_symbol && !order.yes_symbol_req) {
      setCurrentStep(0);
    } else if (!order.no_symbol && !order.no_symbol_req) {
      setCurrentStep(1);
    } else if (order.draw_asset && !order.draw_symbol && !order.draw_symbol_req) {
      setCurrentStep(2);
    }
  }, [order]);

  useEffect(() => {
    setIsAvailable(undefined);
    let symbol: string;
    const feed_name = order.data.feed_name;
    const type = String(currentStep === 0 ? "yes" : currentStep === 1 ? "no" : "draw").toUpperCase();
    const momentDate = moment.utc(order.data.event_date, "YYYY-MM-DDTHH:mm:ss").utc();
    const date = momentDate.format(momentDate.hours() === 0 && momentDate.minutes() === 0 ? "YYYY-MM-DD" : "YYYY-MM-DD-hhmm");

    if (appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === order.data.oracle)) {
      const [, yes_team, no_team] = feed_name.split("_");
      const actual_team = currentStep === 0 ? yes_team : currentStep === 1 ? no_team : "DRAW";

      symbol = String(`${feed_name}_${actual_team}`).toUpperCase();
    } else {
      symbol = `${feed_name}_${date}_${type}`;
    }

    setToken({
      value: symbol,
      valid: true,
    });

    setTokenSupport(initStateValue);
    setDescr(initStateValue);

    (async () => {
      const symbol = await client.api.getSymbolByAsset(tokenRegistry, currentAsset);
      if (symbol !== currentAsset.replace(/[+=]/, "").substr(0, 6)) {
        setSymbolByCurrentAsset(symbol);
      } else {
        setSymbolByCurrentAsset(null);
      }
      setIsAvailable(null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, setSymbolByCurrentAsset, currentAsset]);

  useEffect(() => {
    if (isAvailable === null) {
      (async () => {
        const asset = await client.api.getAssetBySymbol(tokenRegistry, token.value);
        if (asset) {
          const name = token.value;
          const split = name.split("_");
          const hasNumber = !isNaN(Number(split[split.length - 1]));
          const number = split.length >= 2 && hasNumber ? Number(split[split.length - 1]) + 1 : 2;

          setToken({ value: (hasNumber ? split.slice(0, -1).join("_") : name) + "_" + number, valid: true });
        } else {
          setIsAvailable(true);

          let value: string;

          if (isSportMarket) {
            const { yes_team, no_team } = order.data;

            const current_team = currentStep === 0 ? yes_team : currentStep === 1 ? no_team : "DRAW";
            const another_team = currentStep === 0 ? no_team : currentStep === 1 ? yes_team : "DRAW";
            const date = moment.utc(order.data.event_date, "YYYY-MM-DDTHH:mm:ss").utc().format("lll");

            if (current_team !== "DRAW") {
              value = `${current_team} will win the match against ${another_team} on ${date} UTC`;
            } else {
              value = `The match between ${yes_team} and ${no_team} on ${date} UTC will end with a draw`;
            }
          } else {
            value = `${String(currentSymbol).toUpperCase()}-token for event: "${generateTextEvent({ ...order.data, event_date: moment.utc(order.data.event_date, "YYYY-MM-DDTHH:mm:ss").unix(), isUTC: true, yes_team_name: undefined, no_team_name: undefined })}"`;
          }

          setDescr({
            value,
            valid: value.length <= 140,
          });

          setTokenSupport({ value: "0.1", valid: true });
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAvailable, currentSymbol, token]);

  const data = {
    asset: currentAsset,
    symbol: token.value,
    decimals: order.data.reserve_decimals,
    description: (isAvailable && descr.valid && !symbolByCurrentAsset && descr.value) || undefined,
  };

  const handleChangeSupport = (ev: ChangeEvent<HTMLInputElement>) => {
    const support = ev.target.value;
    const reg = /^[0-9.]+$/;
    const f = (x: unknown) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);
    if (support) {
      if (reg.test(support) && f(support) <= 9) {
        if (Number(support) >= 0.1) {
          setTokenSupport({ ...token, value: support, valid: true });
        } else {
          setTokenSupport({ ...token, value: support, valid: false });
        }
      }
    } else {
      setTokenSupport({ ...token, value: "", valid: false });
    }
  };

  let helpSymbol: string | undefined = undefined;
  if (isBoolean(isAvailable)) {
    if (isAvailable) {
      helpSymbol = `Symbol name ${token.value} is available, you can register it`;
    } else {
      helpSymbol = "This token name is already taken.";
    }
  }

  const clickOnRegBtn = (ev: KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === "Enter") {
      if (token.valid && descr.valid && tokenSupport.valid) {
        regRef.current?.click();
      }
    }
  };

  const steps = [{ title: `Symbol for ${yes_team ? yes_team : "YES"}-token` }, { title: `Symbol for ${no_team ? no_team : "NO"}-token` }, ...(order.draw_asset ? [{ title: "Symbol for DRAW-token" }] : [])];

  return (
    <div>
      <Helmet title="Prophet prediction markets — Symbol registration" />
      <Steps current={currentStep} className="mt-5" direction={width > 800 ? "horizontal" : "vertical"} items={steps} />

      <form className="text-base" style={{ marginTop: 35 }} onSubmit={(e) => e.preventDefault()}>
        <FormItem extra={helpSymbol && <span style={{ color: isAvailable ? "green" : "red" }}>{helpSymbol}</span>} status={(isAvailable === false && "error") || (isAvailable === true && "success") || undefined}>
          {(control) => <Input {...control} placeholder="Symbol" autoFocus={true} disabled={true} autoComplete="off" value={token.value} readOnly />}
        </FormItem>
        {isAvailable && (
          <FormItem status={tokenSupport.valid ? undefined : "error"} extra={!tokenSupport.valid ? <span style={{ color: "red" }}>Min amount 0.1 GB</span> : null}>
            {(control) => <InputGroup {...control} placeholder="Support (Min amount 0.1 GB)" suffix="GB" autoComplete="off" disabled={true} value={tokenSupport.value} onChange={handleChangeSupport} autoFocus={isBoolean(isAvailable)} onKeyDown={clickOnRegBtn} />}
          </FormItem>
        )}

        {isAvailable === true && !symbolByCurrentAsset && (
          <FormItem status={descr.valid ? undefined : "error"} extra={!descr.valid ? <span style={{ color: "red" }}>Maximum number of characters 140</span> : null}>
            {(control) => <Textarea {...control} style={{ fontSize: 16 }} rows={5} value={descr.value} disabled={true} readOnly placeholder="Description of an asset (up to 140 characters)" />}
          </FormItem>
        )}

        <FormItem>
          <div className="flex items-center gap-2">
            {isAvailable === undefined || isAvailable === null ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  setIsAvailable(null);
                }}
                key="btn-check"
                disabled={isAvailable === null || token.value === "" || !token.valid}
                ref={checkRef}
              >
                {isAvailable === null && <Loader2 className="animate-spin" data-icon="inline-start" />}
                Check availability
              </Button>
            ) : (
              <QRButton
                size="large"
                disabled={!token.valid || !tokenSupport.valid || !descr.valid}
                key="btn-reg"
                ref={regRef}
                href={generateLink({
                  amount: Math.ceil(Number(tokenSupport.value) * 1e9),
                  data,
                  aa: tokenRegistry,
                })}
              >
                Register
              </QRButton>
            )}
          </div>
        </FormItem>
      </form>
    </div>
  );
};
