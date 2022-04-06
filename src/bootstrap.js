import { store } from "index";
import client from "services/obyte";

export const bootstrap = async () => {
  console.log("connect");
  const state = store.getState();

  const heartbeat = setInterval(function () {
    client.api.heartbeat();
  }, 10 * 1000);

  client.subscribe((err, result) => {
    if (err) return null;

  });
  
  client.client.ws.addEventListener("close", () => {
    clearInterval(heartbeat);
  });
}