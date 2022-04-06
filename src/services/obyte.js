import obyte from "obyte";
import { bootstrap } from "bootstrap";

let client = new obyte.Client(
  `wss://obyte.org/bb${process.env.REACT_APP_ENVIRONMENT === "testnet" ? "-test" : ""}`,
  {
    testnet: process.env.REACT_APP_ENVIRONMENT === "testnet",
    reconnect: true,
  }
);

client.onConnect(bootstrap);

export default client;