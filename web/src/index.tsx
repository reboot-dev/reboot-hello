import { RebootClient, RebootClientProvider } from "@reboot-dev/reboot-react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

if (process.env.REACT_APP_REBOOT_ENDPOINT === undefined) {
  root.render("Please set 'REACT_APP_REBOOT_ENDPOINT' in '.env'");
} else {
  const client = new RebootClient(
    process.env.REACT_APP_REBOOT_ENDPOINT as string
  );

  root.render(
    <React.StrictMode>
      <RebootClientProvider client={client}>
        <App />
      </RebootClientProvider>
    </React.StrictMode>
  );
}
reportWebVitals();
