import React, { useState, useEffect, useRef } from "react";
import { Steps, Input, Form, Button, Space } from "antd";
import client from "services/obyte";
import { isBoolean } from "lodash";
import { useSelector } from "react-redux";
import QRButton from "obyte-qr-button";
import moment from "moment";

import { generateLink, generateTextEvent } from "utils";
import { useWindowSize } from "hooks";

import appConfig from "appConfig";

const { Step } = Steps;

const reservedTokens = ["GBYTE", "MBYTE", "KBYTE", "BYTE"];

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
  const symbolInputRef = useRef(null);
  // const dispatch = useDispatch();

  const isSportMarket = !!appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === order.data.oracle);
  const currentAsset = order[currentSymbol + "_asset"];

  // let actual_team;
  let yes_team;
  let no_team;

  if (isSportMarket) {
    const split = order.data.feed_name.split("_");
    yes_team = split[1];
    no_team = split[2];
    // actual_team = currentStep === 0 ? yes_team : (currentStep === 1 ? no_team : 'DRAW');
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
    const date = moment.unix(order.data.event_date).format("YYYY-MM-DD");

    if (appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === order.data.oracle)) {

      // eslint-disable-next-line no-unused-vars
      const [_, yes_team, no_team] = feed_name.split("_");
      const actual_team = currentStep === 0 ? yes_team : (currentStep === 1 ? no_team : 'DRAW');

      symbol = String(`${feed_name}_${actual_team}`).toUpperCase();
    } else if (isSportMarket) {

      symbol = `${feed_name}_${order.data.datafeed_value}_${date}_${type}`
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
          setIsAvailable(undefined);
          const name = token.value;
          const split = name.split("#");
          const number = split.length >= 2 ? Number(split[split.length - 1]) + 1 : 2;

          setToken({ value: split[0] + "#" + number, valid: true })
        } else {

          setIsAvailable(true);

          let value;

          if (isSportMarket) {
            const { yes_team, no_team } = order.data;

            const actual_team = currentStep === 0 ? yes_team : (currentStep === 1 ? no_team : 'DRAW');
            const date = moment.unix(order.data.event_date).format("lll");

            if (actual_team !== 'DRAW') {
              value = `${yes_team} will win the match against ${no_team} on ${date}`
            } else {
              value = `The match between ${yes_team} and ${no_team} on ${date} will end with a draw`;
            }

          } else {
            value = `${String(currentSymbol).toUpperCase()}-token for event: "${generateTextEvent({ ...order.data })}"`;
          }

          setDescr({
            value,
            valid: value.length <= 140,
          });

          setTokenSupport({ value: "0.1", valid: true })
        }
      })();
      symbolInputRef?.current.blur();
    } else if (isAvailable === undefined) {
      symbolInputRef?.current.focus({
        cursor: 'end',
      });
    }
  }, [isAvailable, currentSymbol]);

  const data = {
    asset: currentAsset,
    symbol: token.value,
    decimals: order.data.reserve_decimals,
    description:
      (isAvailable && descr.valid && !symbolByCurrentAsset && descr.value) ||
      undefined,
  };

  const handleChangeSymbol = (ev) => {
    const targetToken = ev.target.value.toUpperCase();
    // eslint-disable-next-line no-useless-escape
    const reg = /^[0-9A-Z_\-]+$/;
    if (reg.test(targetToken) || !targetToken) {
      if (targetToken.length > 0) {
        if (targetToken.length <= 40) {
          if (reservedTokens.find((t) => targetToken === t)) {
            setToken({ ...token, value: targetToken, valid: false });
          } else {
            setToken({ ...token, value: targetToken, valid: true });
          }
        } else {
          setToken({
            ...token,
            value: targetToken,
            valid: false,
          });
        }
      } else {
        setToken({ ...token, value: targetToken, valid: false });
      }
      setIsAvailable(undefined);
      setTokenSupport(initStateValue);
      setDescr(initStateValue);
    }
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
  const handleChangeDescr = (ev) => {
    const { value } = ev.target;
    if (value.length < 140) {
      setDescr({ value, valid: true });
    } else {
      setDescr({ value, valid: false });
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
            allowClear
            autoFocus={true}
            disabled={true}
            ref={symbolInputRef}
            autoComplete="off"
            value={token.value}
            onChange={handleChangeSymbol}
            onKeyPress={(ev) => {
              if (ev.key === "Enter") {
                if (token.valid) {
                  checkRef.current.click();
                }
              }
            }}
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
              onChange={handleChangeDescr}
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
      {/* <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button type="link" danger onClick={() => dispatch(cancelRegSymbol())}>skip registering symbols</Button>
      </div> */}
    </div>
  );
};