import { createRoot } from "react-dom/client";
import App from "./App";
import { mountPostHogReplay } from "./lib/posthog-replay.mjs";
import "./styles.css";

// Masked, consent-controlled session replay. Without project settings this is a no-op.
mountPostHogReplay();

createRoot(document.getElementById("root")!).render(<App />);
