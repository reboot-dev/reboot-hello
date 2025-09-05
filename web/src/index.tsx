import { RebootClientProvider } from "@reboot-dev/reboot-react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const url =
  (import.meta.env.VITE_REBOOT_URL as string) || "http://localhost:9991";

root.render(
  <React.StrictMode>
    <RebootClientProvider url={url}>
      <App />
    </RebootClientProvider>
  </React.StrictMode>
);
