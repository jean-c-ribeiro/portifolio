import React from "react";
import { createRoot } from "react-dom/client";
import { Replica } from "./Replica.jsx";
import "./reference-original.css";
import "./replica.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Replica />
  </React.StrictMode>,
);
