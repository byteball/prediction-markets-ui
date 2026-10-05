import { Stock } from '@ant-design/plots';
import moment from 'moment';

import appConfig from 'appConfig';

export const CurrencyChart = ({ data, params }) => {
  const { datafeed_value, waiting_period_length, event_date, feed_name } = params;
  const now = moment.utc().unix();
  const isCoingeckoData = (feed_name.split("_")?.[0] === "GBYTE") && params.event_date > now;
  const momentFormat = ((event_date + waiting_period_length - moment.utc().unix() <= 7 * 24 * 3600) || isCoingeckoData) ? 'lll' : 'll';

  const transformedData = data.map(({ time, open, close, high, low }) => ({
    time: moment.unix(time).locale('en').format(momentFormat),
    open: +Number(open).toPrecision(6),
    close: +Number(close).toPrecision(6),
    high: +Number(high).toPrecision(6),
    low: +Number(low).toPrecision(6),
  }));

  const config = {
    data: transformedData,
    xField: 'time',
    theme: "dark",
    legend: false,
    animation: false,
    renderer: 'svg',
    risingFill: '#26a69a',
    fallingFill: "#ef5350",
    tooltip: {
      showCrosshairs: false,
      title: (_, { time }) => {
        return time;
      }
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
      {
        type: 'line',
        start: [moment.unix(event_date).locale('en').format(momentFormat), 'min'],
        end: [moment.unix(event_date).locale('en').format(momentFormat), 'max'],
        style: {
          stroke: appConfig.DRAW_COLOR,
          lineDash: [4, 4],
          lineWidth: 4
        },
        text: {
          content: 'Event date',
          offsetX: -5,
          style: {
            fontSize: 14,
            fill: appConfig.DRAW_COLOR,
          }
        }
      },
    ]
  };

  return <div style={{ margin: '20px 0' }}>
    <Stock {...config} />
  </div>
};