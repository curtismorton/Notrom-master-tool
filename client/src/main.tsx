import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import performance optimizations
import "./lib/performance";

// Clear the initial loading state immediately
const root = document.getElementById("root")!;
if (root.innerHTML.includes("Loading Notrom")) {
  root.innerHTML = "";
}

createRoot(root).render(<App />);
