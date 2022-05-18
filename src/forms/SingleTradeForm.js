import { RetweetOutlined } from "@ant-design/icons";
import { Form, Select, Input, Button, Alert } from "antd";
import { SwitchActions } from "components/SwitchActions/SwitchActions";
import { isNaN } from "lodash";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars } from "store/slices/activeSlice";
import { selectWalletAddress } from "store/slices/settingsSlice";
import { generateLink } from "utils/generateLink";
import { getExchangeResult, get_token_amount } from "utils/getExchangeResult";


const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export const SingleTradeForm = () => {
  const stateVars = useSelector(selectActiveMarketStateVars);
  const address = useSelector(selectActiveAddress);
  const params = useSelector(selectActiveMarketParams);
  const walletAddress = useSelector(selectWalletAddress);

  const { reserve_asset, yes_symbol, no_symbol, draw_symbol, allow_draw, reserve_symbol, reserve_decimals, yes_decimals, no_decimals, draw_decimals } = params;
  const { yes_asset, no_asset, draw_asset } = stateVars;
  const [pairs, setPairs] = useState({});

  const [fromTokenList, setFromTokenList] = useState([]);
  const [fromToken, setFromToken] = useState({ symbol: reserve_symbol, asset: reserve_asset, type: 'reserve', decimals: reserve_decimals });
  const [toToken, setToToken] = useState({ symbol: yes_symbol, asset: yes_asset, type: 'yes', decimals: yes_decimals });

  const [fromAmount, setFromAmount] = useState({ value: 0.1, valid: true });
  const [toAmount, setToAmount] = useState({ value: '', valid: true });

  const [currentPairs, setCurrentPairs] = useState([]);

  const network_fee = reserve_asset === 'base' ? 1e4 : 0;

  const [meta, setMeta] = useState({});

  const [error, setError] = useState(null);

  useEffect(() => {
    setCurrentPairs(pairs[fromToken.asset]);

    if (currentPairs && currentPairs[0]) {
      setToToken(currentPairs[0])
    }
  }, [fromToken, pairs])

  useEffect(() => {
    if (currentPairs?.[0]) {
      setToToken(currentPairs[0])
    }
  }, [currentPairs]);

  useEffect(() => {
    const pairs = {
      [reserve_asset]: [
        { symbol: yes_symbol, asset: yes_asset, type: 'yes', decimals: yes_decimals },
        { symbol: no_symbol, asset: no_asset, type: 'no', decimals: no_decimals },
      ],
      [yes_asset]: [
        // { symbol: no_symbol, asset: no_asset, type: 'no' },
        { symbol: reserve_symbol, asset: reserve_asset, type: 'reserve', decimals: reserve_decimals }
      ],
      [no_asset]: [
        // { symbol: yes_symbol, asset: yes_asset, type: 'yes' },
        { symbol: reserve_symbol, asset: reserve_asset, type: 'reserve', decimals: reserve_decimals }
      ]
    }
    const fromList = [
      { symbol: yes_symbol, asset: yes_asset, type: 'yes', decimals: yes_decimals },
      { symbol: no_symbol, asset: no_asset, type: 'no', decimals: no_decimals },
      { symbol: reserve_symbol, asset: reserve_asset, type: 'reserve', decimals: reserve_decimals }
    ]

    if (allow_draw) {
      pairs[reserve_asset].push({ symbol: draw_symbol, asset: draw_asset, decimals: draw_decimals, type: 'draw' });
      // pairs[yes_asset].push({ symbol: draw_symbol, asset: draw_asset, type: 'draw' });
      // pairs[no_asset].push({ symbol: draw_symbol, asset: draw_asset, type: 'draw' });

      fromList.push({ symbol: draw_symbol, asset: draw_asset, decimals: draw_decimals, type: 'draw' });

      pairs[draw_asset] = [
        // { symbol: yes_symbol, asset: yes_asset, type: 'yes' },
        // { symbol: no_symbol, asset: no_asset, type: 'no' },
        { symbol: reserve_symbol, asset: reserve_asset, type: 'reserve' }
      ]
    }

    setPairs(pairs);
    setFromTokenList(fromList);
  }, [reserve_asset, yes_asset, no_asset, draw_asset, address]);

  useEffect(() => {
    if (fromAmount.valid && !isNaN(Number(fromAmount.value))) {
      if (fromToken.asset !== reserve_asset) {
        const token = fromToken;
        const amount = -fromAmount.value * 10 ** fromToken.decimals;
        const res = getExchangeResult(stateVars, params, token.type === 'yes' ? amount : 0, token.type === 'no' ? amount : 0, token.type === 'draw' ? amount : 0);
        const value = res ? +Number((res.payout - res.fee) / 10 ** toToken.decimals).toFixed(toToken.decimals) : 0;

        if (value > 0) {
          setToAmount({ value, valid: true });
          setMeta(res);
          setError(null)
        } else {
          setToAmount({ value: undefined, valid: false });
          setMeta(null);
          setError("The price would change too much, try a smaller amount")
        }


      } else {
        const amount = fromAmount.value * 10 ** fromToken.decimals;
        const type = toToken.type;
        const tokenAmount = get_token_amount(stateVars, params, type, amount);
        const value = +Number((tokenAmount) / 10 ** toToken.decimals).toFixed(toToken.decimals);
        setToAmount({ value: value > 0 ? value : undefined, valid: true });
        // const type = toToken.type;
        const res = getExchangeResult(stateVars, params, type === 'yes' ? tokenAmount : 0, type === 'no' ? tokenAmount : 0, type === 'draw' ? tokenAmount : 0);
        setMeta(value > 0 ? res : null)
        setError(null)
      }
    } else {
      setToAmount({ value: undefined, valid: true })
      setMeta(null);
      setError(null);
    }

  }, [currentPairs, fromToken, toToken, fromAmount, stateVars, address]);

  const handleFromAmount = (ev) => {
    const value = ev.target.value;

    if (value === "") {
      setFromAmount({ value: undefined, valid: true });
    } else {
      if (f(value) <= fromToken.decimals) {
        setFromAmount({ value, valid: !isNaN(Number(value)) && Number(value) > 0 });
      }
    }
  }

  const changeDirection = () => {
    const oldFromToken = { ...fromToken };
    const oldToToken = { ...toToken };

    setFromAmount({ value: +Number(toAmount.value).toFixed(oldToToken.decimals) || '', valid: true });
    setFromToken(oldToToken);
    setToToken(oldFromToken);
  }

  const link = generateLink({ aa: address, asset: fromToken.asset, is_single: true, amount: Math.ceil(+fromAmount.value * 10 ** fromToken.decimals), data: { type: fromToken.asset == reserve_asset ? toToken.type : undefined }, from_address: walletAddress || undefined })

  return (
    <div>
      <SwitchActions data={[
        {
          value: 'buy',
          text: 'Buy'
        },
        {
          value: 'redeem',
          text: 'Redeem'
        }
      ]} />

      <Form size="large" layout="vertical">
        <Form.Item>
          <Select placeholder="Select a send token" value={fromToken.asset} onChange={(fromAsset) => setFromToken(fromTokenList.find((token) => token.asset === fromAsset))}>
            <Select.Option value={reserve_asset}>{reserve_symbol}</Select.Option>
            <Select.Option value={yes_asset}>{yes_symbol} (YES-token)</Select.Option>
            <Select.Option value={no_asset}>{no_symbol} (NO-token)</Select.Option>
            {allow_draw && <Select.Option value={draw_asset}>{draw_symbol} (DRAW-token)</Select.Option>}
          </Select>
        </Form.Item>
        <Form.Item>
          <Input placeholder="Amount" value={fromAmount.value} onChange={handleFromAmount} />
        </Form.Item>
        <Form.Item>
          <div style={{ textAlign: 'center' }}>
            <RetweetOutlined onClick={changeDirection} style={{ fontSize: 48, color: "#ccc", transform: 'rotate(-90deg)', cursor: 'pointer' }} />
          </div>
        </Form.Item>
        <Form.Item>
          <Select placeholder="Select a get token" value={toToken.asset} onChange={(toAsset) => setToToken(currentPairs.find(({ asset }) => asset === toAsset))}>
            {currentPairs?.map(({ asset, symbol, type }) => (<Select.Option key={`to_${asset}`} value={asset}>
              {symbol} {(type && type !== 'reserve') ? '(' + type.toUpperCase() + '-token)' : ''}
            </Select.Option>))}
          </Select>
        </Form.Item>
        <Form.Item>
          <Input placeholder="Amount" disabled={true} value={toAmount.value} />
        </Form.Item>
        {meta && <Form.Item>
          <div style={{ color: '#ccc' }}>
            {meta?.arb_profit_tax !== 0 && <div><span style={{ fontWeight: 500 }}>Arb profit tax</span>: {+Number(meta.arb_profit_tax / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
            {meta?.issue_fee !== 0 && <div><span style={{ fontWeight: 500 }}>Issue fee</span>: {+Number(meta.issue_fee / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
            {meta?.redeem_fee !== 0 && <div><span style={{ fontWeight: 500 }}>Redeem fee</span>: {+Number(meta.redeem_fee / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
            {meta?.fee !== 0 && <div><span style={{ fontWeight: 500 }}>Total fee</span>: {+Number((meta.fee + network_fee) / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
          </div>
        </Form.Item>}
        {error && <Form.Item>
          <Alert type="error" message={error} />
        </Form.Item>}
        <Form.Item>
          <Button href={link} disabled={!fromAmount.valid || !Number(fromAmount.value) || error} type="primary" size="large">Send {fromAmount.valid && Number(fromAmount.value) ? fromAmount.value : ''} {fromToken.symbol}</Button>
        </Form.Item>
      </Form>
    </div>
  )
}