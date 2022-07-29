import { Stock } from '@ant-design/plots';
import moment from 'moment';

import appConfig from 'appConfig';

export const CurrencyChart = ({ data, params }) => {
  const { datafeed_value, waiting_period_length, event_date } = params;

  const transformedData = data.map(({ time, open, close, high, low }) => ({
    time: moment.unix(time).format((event_date + waiting_period_length - moment.utc().unix() <= 7 * 24 * 3600) ? 'lll' : 'll'),
    open: +Number(open).toPrecision(6),
    close: +Number(close).toPrecision(6),
    high: +Number(high).toPrecision(6),
    low: +Number(low).toPrecision(6),
  }))

  const config = {
    data: transformedData,
    xField: 'time',
    theme: "dark",
    legend: false,
    animation: false,
    renderer: 'svg',
    tooltip: {
      showCrosshairs: false
    },
    yField: ['open', 'close', 'high', 'low'],
    yAxis: {
      label: {
        formatter: (v) => +Number(v).toFixed(8),
      },
    },
    annotations: [
      {
        type: 'line',
        start: ['min', datafeed_value],
        end: ['max', datafeed_value],
        style: {
          stroke: appConfig.YES_COLOR,
          lineDash: [4, 4],
          lineWidth: 4
        },
      },
    ]
  };

  return <div style={{ margin: '20px 0' }}>
    <Stock {...config} />
  </div>
}