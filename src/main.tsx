import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerAppServiceWorker } from "./lib/registerSW";

// Validate required environment variables before mounting
const REQUIRED_ENV_VARS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;

for (const key of REQUIRED_ENV_VARS) {
  if (!import.meta.env[key]) {
    document.body.style.cssText = "font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto";
    document.body.innerHTML = `
      <h1>Configuration Error</h1>
      <p>Missing required environment variable: <code>${key}</code></p>
      <p>Copy <code>.env.example</code> to <code>.env.local</code> and fill in your Supabase credentials.</p>
    `;
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error(
    "Root element #root not found in index.html. " +
    "Ensure index.html contains <div id=\"root\"></div>"
  );
}

createRoot(rootElement).render(<App />);

registerAppServiceWorker();
