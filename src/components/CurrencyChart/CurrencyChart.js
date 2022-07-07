import { Stock } from '@ant-design/plots';
import appConfig from 'appConfig';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { selectIsHourlyChart } from 'store/slices/activeSlice';

export const CurrencyChart = ({ data, params }) => {
  const { datafeed_value } = params;
  const isHourlyChart = useSelector(selectIsHourlyChart);

  const filteredData = data.map(({ time, open, close, high, low }) => ({
    time: moment.unix(time).format(isHourlyChart ? 'lll': 'll'),
    open: +Number(open).toPrecision(6),
    close: +Number(close).toPrecision(6),
    high: +Number(high).toPrecision(6),
    low: +Number(low).toPrecision(6),
  }))

  const config = {
    data: filteredData,
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