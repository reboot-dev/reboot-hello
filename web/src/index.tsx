import ReactDOM from "react-dom/client";
import App from "./App";
import {
  ResembleClient,
  ResembleClientProvider,
} from "./ResembleClientProvider";
import "./index.css";
import reportWebVitals from "./reportWebVitals";

const client = new ResembleClient("http://127.0.0.1:9991");

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <ResembleClientProvider client={client}>
    <App />
  </ResembleClientProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
