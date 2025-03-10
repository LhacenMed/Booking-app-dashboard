import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import "@/styles/globals.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <Provider>
      <App />
    </Provider>
  );
}
