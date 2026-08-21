import {
  StrictMode,
} from "react";

import {
  createRoot,
} from "react-dom/client";

import {
  BrowserRouter,
} from "react-router-dom";

import App from "./App";

import {
  AuthProvider,
} from "./context/AuthContext";

import "./styles.css";
import "./sprint2.css";
import "./sprint3.css"; 


createRoot(
  document.getElementById("root")!
).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);