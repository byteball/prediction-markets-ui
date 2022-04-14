import { Badge } from "components/Badge/Badge"

export const PredictionItem = () => {
  return <div style={{ padding: 15, borderRadius: 7, marginBottom: 25, boxShadow: "0px 0px 10px 10px rgba(244,  244,  244, 0.7)" }}>
    <div style={{ paddingBottom: 10 }}><Badge type="active" /> <span style={{ fontWeight: 500, marginLeft: 10, fontSize: 18 }}>Will the Turkish lira (TRY) drop below $0.06?</span></div>
    <div style={{ paddingTop: 10 }}><span>Reserve: $423423</span> <span>Yes price: $4233</span> <span>No price: $4423</span></div>
  </div>
}