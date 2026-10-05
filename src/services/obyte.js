import obyte from "obyte";

import { bootstrap } from "bootstrap";

let client = new obyte.Client(
  `wss://obyte.org/bb${import.meta.env.REACT_APP_ENVIRONMENT === "testnet" ? "-test" : ""}`,
  {
    testnet: import.meta.env.REACT_APP_ENVIRONMENT === "testnet",
    reconnect: true,
  }
);

client.onConnect(bootstrap);

export default client;