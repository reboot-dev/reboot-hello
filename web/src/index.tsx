import { RebootClient, RebootClientProvider } from "@reboot-dev/reboot-react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// Use TLS (via dev.localhost.direct) so we get the advantage of HTTP/2
// multiplexing.
const client = new RebootClient(
  (process.env.REACT_APP_REBOOT_ENDPOINT as string) ||
    "https://dev.localhost.direct:9991"
);

root.render(
  <React.StrictMode>
    <RebootClientProvider client={client}>
      <App />
    </RebootClientProvider>
  </React.StrictMode>
);

reportWebVitals();
