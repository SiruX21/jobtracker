import React, { useState } from "react"; // Import useState here
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Header";
import IntroPage from "./IntroPage";
import TrackerPage from "./TrackerPage";

function App() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <Router>
      <div className={`${darkMode ? "dark" : ""}`}>
        <Header darkMode={darkMode} toggleTheme={toggleTheme} />
        <Routes>
          <Route
            path="/"
            element={<IntroPage darkMode={darkMode} toggleTheme={toggleTheme} />}
          />
          <Route
            path="/track"
            element={<TrackerPage darkMode={darkMode} toggleTheme={toggleTheme} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;