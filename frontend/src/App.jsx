import { useEffect, useState } from "react";
import TestRunner from "./components/TestRunner";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [route, setRoute] = useState(window.location.hash || "#test");

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || "#test");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const isDashboard = route === "#dashboard";

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          <span className="dot" />
          Integrity Signal
        </div>
        <div>
          <a className={`nav-link ${!isDashboard ? "active" : ""}`} href="#test">Take assessment</a>
          <a className={`nav-link ${isDashboard ? "active" : ""}`} href="#dashboard">Examiner dashboard</a>
        </div>
      </div>
      <div className={`main ${isDashboard ? "wide" : ""}`}>
        {isDashboard ? <Dashboard /> : <TestRunner />}
      </div>
    </div>
  );
}
