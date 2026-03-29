import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

setBaseUrl(configuredApiBaseUrl ? configuredApiBaseUrl : null);

document.documentElement.style.setProperty(
  "--parchment-bg-url",
  `url('${import.meta.env.BASE_URL}images/db-parchment-bg.png')`
);

createRoot(document.getElementById("root")!).render(<App />);
