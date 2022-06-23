import { Stock } from '@ant-design/plots';
import appConfig from 'appConfig';
import moment from 'moment';

export const CurrencyChart = ({ data, params }) => {
  const { datafeed_value } = params;

  const filteredData = data.map(({ time, open, close, high, low }) => ({
    time: moment.unix(time).format('ll'),
    open,
    close,
    high,
    low,
  }))

  const config = {
    data: filteredData,
    xField: 'time',
    theme: "dark",
    legend: false,
    animation:false,
    renderer: 'svg',
    tooltip: {
      showCrosshairs: false
    },
    yField: ['open', 'close', 'high', 'low'],
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