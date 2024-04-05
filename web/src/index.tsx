import {
  ResembleClient,
  ResembleClientProvider,
} from "@reboot-dev/resemble-react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
// Use TLS (via localhost.direct) so we get the advantage of HTTP/2
// multiplexing.
const client = new ResembleClient(
  process.env.REACT_APP_REBOOT_RESEMBLE_ENDPOINT as string
);

root.render(
  <React.StrictMode>
    <ResembleClientProvider client={client}>
      <App />
    </ResembleClientProvider>
  </React.StrictMode>
);

reportWebVitals();
