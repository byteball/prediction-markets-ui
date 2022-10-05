import React, { useState, useEffect, useRef } from "react";
import { Steps, Input, Form, Button, Space } from "antd";
import client from "services/obyte";
import { isBoolean } from "lodash";
import { useSelector } from "react-redux";
import { QRButton } from "components/QRButton/QRButton";
import moment from "moment";
import { Helmet } from "react-helmet-async";

import { generateLink, generateTextEvent } from "utils";
import { useWindowSize } from "hooks";

import appConfig from "appConfig";

const { Step } = Steps;

const initStateValue = {
  value: "",
  valid: false,
};

const tokenRegistry = client.api.getOfficialTokenRegistryAddress();

export const RegisterSymbols = () => {
  const order = useSelector((state) => state.settings.creationOrder);

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
  const currentSymbol = initCurrentStep === 0 ? 'yes' : (initCurrentStep === 1 ? 'no' : 'draw');

  const [isAvailable, setIsAvailable] = useState(undefined);
  const [symbolByCurrentAsset, setSymbolByCurrentAsset] = useState(undefined);
  const [token, setToken] = useState(initStateValue);
  const [tokenSupport, setTokenSupport] = useState(initStateValue);
  const [descr, setDescr] = useState(initStateValue);


  const checkRef = useRef(null);
  const regRef = useRef(null);

  const isSportMarket = !!appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === order.data.oracle);
  const currentAsset = order[currentSymbol + "_asset"];

  let yes_team;
  let no_team;

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
    let symbol;
    const feed_name = order.data.feed_name;
    const type = String(currentStep === 0 ? 'yes' : (currentStep === 1 ? 'no' : 'draw')).toUpperCase();
    const momentDate = moment.utc(order.data.event_date, 'YYYY-MM-DDTHH:mm:ss').utc();
    const date = momentDate.format((momentDate.hours() === 0 && momentDate.minutes() === 0) ? "YYYY-MM-DD" : "YYYY-MM-DD-hhmm");

    if (appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === order.data.oracle)) {

      // eslint-disable-next-line no-unused-vars
      const [_, yes_team, no_team] = feed_name.split("_");
      const actual_team = currentStep === 0 ? yes_team : (currentStep === 1 ? no_team : 'DRAW');

      symbol = String(`${feed_name}_${actual_team}`).toUpperCase();
    } else {
      symbol = `${feed_name}_${date}_${type}`
    }

    setToken({
      value: symbol,
      valid: true
    });

    setTokenSupport(initStateValue);
    setDescr(initStateValue);

    (async () => {
      const symbol = await client.api.getSymbolByAsset(
        tokenRegistry,
        currentAsset
      );
      if (symbol !== currentAsset.replace(/[+=]/, "").substr(0, 6)) {
        setSymbolByCurrentAsset(symbol);
      } else {
        setSymbolByCurrentAsset(null);
      }
      setIsAvailable(null);
    })();
  }, [currentStep, setSymbolByCurrentAsset, currentAsset]);

  useEffect(() => {
    if (isAvailable === null) {
      (async () => {
        const asset = await client.api.getAssetBySymbol(
          tokenRegistry,
          token.value
        );
        if (!!asset) {
          const name = token.value;
          const split = name.split("_");
          const hasNumber = !isNaN(Number(split[split.length - 1]));
          const number = (split.length >= 2 && hasNumber) ? Number(split[split.length - 1]) + 1 : 2;

          setToken({ value: (hasNumber ? split.slice(0, -1).join("_") : name) + "_" + number, valid: true })
        } else {

          setIsAvailable(true);

          let value;

          if (isSportMarket) {
            const { yes_team, no_team } = order.data;

            const current_team = currentStep === 0 ? yes_team : (currentStep === 1 ? no_team : 'DRAW');
            const another_team = currentStep === 0 ? no_team : (currentStep === 1 ? yes_team : 'DRAW')
            const date = moment.utc(order.data.event_date, 'YYYY-MM-DDTHH:mm:ss').utc().format("lll");

            if (current_team !== 'DRAW') {
              value = `${current_team} will win the match against ${another_team} on ${date} UTC`
            } else {
              value = `The match between ${yes_team} and ${no_team} on ${date} UTC will end with a draw`;
            }

          } else {
            value = `${String(currentSymbol).toUpperCase()}-token for event: "${generateTextEvent({ ...order.data, event_date: moment.utc(order.data.event_date, 'YYYY-MM-DDTHH:mm:ss').unix(), isUTC: true })}"`;
          }

          setDescr({
            value,
            valid: value.length <= 140,
          });

          setTokenSupport({ value: "0.1", valid: true })
        }
      })();
    }
  }, [isAvailable, currentSymbol, token]);

  const data = {
    asset: currentAsset,
    symbol: token.value,
    decimals: order.data.reserve_decimals,
    description:
      (isAvailable && descr.valid && !symbolByCurrentAsset && descr.value) ||
      undefined,
  };

  const handleChangeSupport = (ev) => {
    const support = ev.target.value;
    const reg = /^[0-9.]+$/;
    const f = (x) =>
      ~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0;
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

  let helpSymbol = undefined;
  if (isBoolean(isAvailable)) {
    if (isAvailable) {
      helpSymbol = `Symbol name ${token.value} is available, you can register it`;
    } else {
      helpSymbol = "This token name is already taken.";
    }
  }

  const clickOnRegBtn = (ev) => {
    if (ev.key === "Enter") {
      if (token.valid && descr.valid && tokenSupport.valid) {
        regRef.current.click();
      }
    }
  }

  return (
    <div>
      <Helmet title="Prophet prediction markets — Symbol registration" />
      <Steps
        current={currentStep}
        style={{ marginTop: 20 }}
        direction={width > 800 ? "horizontal" : "vertical"}
      >
        <Step title={`Symbol for ${yes_team ? yes_team : "YES"}-token`} />
        <Step title={`Symbol for ${no_team ? no_team : "NO"}-token`} />
        {order.draw_asset && <Step title="Symbol for DRAW-token" />}
      </Steps>

      <Form size="large" style={{ marginTop: 35 }}>
        <Form.Item
          extra={helpSymbol && <span style={{ color: isAvailable ? "green" : "red" }}>{helpSymbol}</span>}
          validateStatus={
            (isAvailable === false && "error") ||
            (isAvailable === true && "success")
          }
        >
          <Input
            placeholder="Symbol"
            autoFocus={true}
            disabled={true}
            autoComplete="off"
            value={token.value}
          />
        </Form.Item>
        {isAvailable && (
          <Form.Item
            validateStatus={tokenSupport.valid ? undefined : "error"}
            extra={!tokenSupport.valid ? <span style={{ color: 'red' }}>Min amount 0.1 GB</span> : null}
          >
            <Input
              placeholder="Support (Min amount 0.1 GB)"
              suffix="GB"
              autoComplete="off"
              disabled={true}
              value={tokenSupport.value}
              onChange={handleChangeSupport}
              autoFocus={isBoolean(isAvailable)}
              onKeyPress={clickOnRegBtn}
            />
          </Form.Item>
        )}

        {isAvailable === true && !symbolByCurrentAsset && (
          <Form.Item
            validateStatus={descr.valid ? undefined : "error"}
            extra={!descr.valid ? <span style={{ color: 'red' }}>Maximum number of characters 140</span> : null}
          >
            <Input.TextArea
              style={{ fontSize: 16 }}
              rows={5}
              value={descr.value}
              disabled={true}
              placeholder="Description of an asset (up to 140 characters)"
            />
          </Form.Item>
        )}

        <Form.Item>
          <Space>
            {isAvailable === undefined || isAvailable === null ? (
              <Button
                onClick={() => {
                  setIsAvailable(null);
                }}
                key="btn-check"
                loading={isAvailable === null}
                disabled={token.value === "" || !token.valid}
                ref={checkRef}
              >
                Check availability
              </Button>
            ) : (
              <QRButton
                disabled={!token.valid || !tokenSupport.valid || !descr.valid}
                key="btn-reg"
                ref={regRef}
                href={generateLink(
                  {
                    amount: Math.ceil(tokenSupport.value * 1e9),
                    data,
                    aa: tokenRegistry
                  }
                )}
              >Register
              </QRButton>
            )}
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};