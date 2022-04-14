export const Badge = ({ type }) => {
  let text = "Active";
  let background = '#53C41A';

  if (type === 'active') {
    text = 'Active';
    background = '#53C41A';
  }
  return <span style={{ background, padding: "5px 10px", borderRadius: 7, color: "#fff", fontWeight: 500 }}>
    {text}
  </span>
}