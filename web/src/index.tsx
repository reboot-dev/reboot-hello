import { RebootClientProvider } from "@reboot-dev/reboot-react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const url =
  (process.env.REACT_APP_REBOOT_URL as string) || "http://localhost:9991";

root.render(
  <React.StrictMode>
    <RebootClientProvider url={url}>
      <App />
    </RebootClientProvider>
  </React.StrictMode>
);

reportWebVitals();
