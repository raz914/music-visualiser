import { createRoot } from "react-dom/client";
import "./index.scss";
import App from "./App.jsx";
import audioController from "./utils/AudioController";

// Initialize audio controller when the app starts
audioController.setup();

createRoot(document.getElementById("root")).render(<App />);
