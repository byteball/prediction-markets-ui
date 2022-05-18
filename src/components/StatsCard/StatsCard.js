import { TinyArea } from '@ant-design/plots';
import { InfoTooltip } from 'components/InfoTooltip/InfoTooltip';

const smallData = [
  264, 417, 438, 887, 309, 397, 550, 575, 563, 430, 525, 592, 492, 467, 513, 546, 983, 340, 539, 243, 226, 192,
];

const config = {
  // height: 70,
  // autoFit: true,
  data: smallData,
  animation: false,
  smooth: true,
  color: '#F0F5FF'
};

export const StatsCard = ({ title, desc = 'info', value = null, subValue = <span>205.923123 <small>GBYTE</small></span>, showChart = false }) => {
  return <div style={{ background: '#303030', borderRadius: 15, padding: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
    <div>
      <div style={{ textTransform: 'uppercase', fontSize: 16 }}>{title}</div>
      <div style={{ fontWeight: 500, fontSize: 28, minHeight: '1em'}}>{value}</div>
      <div>{subValue}</div>
    </div>
    {showChart && <div style={{ marginTop: 10, height: 50, maxWidth: '160px' }}>
      <TinyArea {...config} />
    </div>}
    <div style={{ position: "absolute", top: 17, right: 15 }}><InfoTooltip style={{}} title={desc} /></div>
  </div>
}




// export const StatsCard = ({ title }) => {
//   return <div style={{ background: '#f0f5ff', borderRadius: 15, padding: 15 }}>
//     <div>
//       <div style={{ textTransform: 'uppercase', fontSize: 16 }}>{title} <InfoTooltip title="info" /></div>
//       <div style={{ fontWeight: 'bold', fontSize: 28 }}>$9253</div>
//       <div>205.923123 <small>GBYTE</small></div>
//     </div>
//     <div style={{ marginTop: 10 }}>
//       <TinyArea {...config} />
//     </div>
//   </div>
// }