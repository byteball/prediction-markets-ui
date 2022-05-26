import { Form, Input } from "antd";
import QRButton from "obyte-qr-button";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars } from "store/slices/activeSlice";
import { selectWalletAddress } from "store/slices/settingsSlice";
import { generateLink } from "utils/generateLink";
import { getExchangeResult } from "utils/getExchangeResult";

const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export const AddLiquidityForm = () => {
  const params = useSelector(selectActiveMarketParams);
  const stateVars = useSelector(selectActiveMarketStateVars);

  const walletAddress = useSelector(selectWalletAddress);
  const address = useSelector(selectActiveAddress);

  const [tokens, setTokens] = useState([]);
  const [amountByType, setAmountByType] = useState();
  const [meta, setMeta] = useState(null);
  const [sendAmount, setSendAmount] = useState({ value: undefined, valid: true });

  const { yes_symbol, no_symbol, draw_symbol, allow_draw, yes_decimals, no_decimals, draw_decimals, reserve_asset, reserve_decimals, reserve_symbol } = params;
  const { supply_yes = 0, supply_no = 0, supply_draw = 0 } = stateVars;

  const network_fee = reserve_asset === 'base' ? 1e4 : 0;

  useEffect(() => {
    const tokens = [
      { symbol: yes_symbol, decimals: yes_decimals, type: 'yes', disabled: supply_yes === 0 },
      { symbol: no_symbol, decimals: no_decimals, type: 'no', disabled: supply_no === 0 },
    ];

    if (allow_draw) {
      tokens.push({ symbol: draw_symbol, decimals: draw_decimals, type: 'draw', disabled: supply_draw === 0 })
    }

    handleChangeAmount(1, 'yes')
    setTokens(tokens);
  }, [yes_symbol, no_symbol, draw_symbol, allow_draw, stateVars])

  const data = {
    yes_amount: Math.ceil(Number(amountByType?.yes?.value || 0) * 10 ** yes_decimals),
    no_amount: Math.ceil(Number(amountByType?.no?.value || 0) * 10 ** no_decimals)
  };

  if (allow_draw) {
    data.draw_amount = Math.ceil(Number(amountByType?.draw?.value || 0) * 10 ** draw_decimals);
  }

  const link = generateLink({
    aa: address, asset: reserve_asset, is_single: true, amount: Math.ceil(sendAmount.value), data, from_address: walletAddress || undefined
  })

  const handleChangeAmount = (value, type) => {
    let result = {};

    const decimals = type === 'yes' ? yes_decimals : (type === 'no' ? no_decimals : draw_decimals);

    if (value === "" || isNaN(Number(value)) || Number(value) === 0) {
      setSendAmount({ value: undefined, valid: true });

      result = {
        no: {
          value: '',
          valid: false
        },
        draw: {
          value: '',
          valid: false
        },
        [type]: {
          value,
          valid: false
        }
      };

      setAmountByType(result);

    } else {
      if (f(value) <= decimals) {
        if (type === 'yes') {
          result = {
            yes: {
              value,
              valid: true
            },
            no: {
              value: +Number(value * (supply_no / supply_yes)).toFixed(no_decimals),
              valid: true
            },
            draw: {
              value: allow_draw ? +Number(value * (supply_draw / supply_yes)).toFixed(draw_decimals) : 0,
              valid: true
            }
          };
        } else if (type === 'no') {
          result = {
            no: {
              value,
              valid: true
            },
            yes: {
              value: +Number(value * (supply_yes / supply_no)).toFixed(yes_decimals),
              valid: true
            },
            draw: {
              value: allow_draw ? +Number(value * (supply_draw / supply_no)).toFixed(draw_decimals) : 0,
              valid: true
            }
          };
        } else if (type === 'draw') {
          result = {
            draw: {
              value,
              valid: true
            },
            yes: {
              value: +Number(value * (supply_yes / supply_draw)).toFixed(yes_decimals),
              valid: true
            },
            no: {
              value: +Number(value * (supply_no / supply_draw)).toFixed(no_decimals),
              valid: true
            }
          };
        }
        setAmountByType(result);
      }
    }
  }

  useEffect(() => {
    if (amountByType?.yes?.valid && amountByType?.no?.valid && amountByType?.draw?.valid) {
      const result = getExchangeResult(stateVars, params, (amountByType?.yes.value || 0) * 10 ** yes_decimals, (amountByType?.no.value || 0) * 10 ** no_decimals, (amountByType?.draw.value || 0) * 10 ** (draw_decimals || 0));

      if (result) {
        setSendAmount({ value: result.reserve_needed + result.fee + network_fee, valid: true });
        setMeta(result);
      }

    } else {
      setMeta(null);
    }
  }, [amountByType, address, stateVars]);

  const valid = amountByType?.yes?.valid && amountByType?.no?.valid && amountByType?.draw?.valid && sendAmount.valid && Number(sendAmount.value) > 0;

  return <Form size="large">
    {tokens.map(({ symbol, type, disabled }) => <Form.Item key={`${symbol}-${type}`}>
      <Input placeholder={`Amount ${type}-tokens`} disabled={disabled} value={amountByType?.[type]?.value} onChange={(e) => handleChangeAmount(e.target.value, type)} suffix={symbol} />
    </Form.Item>)}
    {meta && <Form.Item>
      <div style={{ color: '#ccc' }}>
        {meta?.issue_fee !== 0 && <div><span style={{ fontWeight: 500 }}>Issue fee</span>: {+Number(meta.issue_fee / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
        {meta?.redeem_fee !== 0 && <div><span style={{ fontWeight: 500 }}>Redeem fee</span>: {+Number(meta.redeem_fee / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
        {meta?.fee !== 0 && <div><span style={{ fontWeight: 500 }}>Total fee</span>: {+Number((meta.fee + network_fee) / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
      </div>
    </Form.Item>}
    <Form.Item>
      <QRButton type="primary" disabled={!valid} href={link}>Send {sendAmount.valid && Number(sendAmount.value) ? Number(sendAmount.value) / 10 ** reserve_decimals : ''} {reserve_symbol}</QRButton>
    </Form.Item>
  </Form>
}