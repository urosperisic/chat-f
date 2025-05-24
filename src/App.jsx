import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./pages/Home";
import AdminPanel from "./pages/AdminPanel";
import { useAuth } from "./context/useAuth";

// Header komponenta
const Header = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const getTitle = () => {
    if (location.pathname === "/admin") return "Admin Panel";
    if (location.pathname === "/") return "Messages (WS)";
    return "";
  };

  if (location.pathname === "/login" || location.pathname === "/register") {
    return null; // Ne prikazuj header na login/register stranici
  }

  return (
    <header>
      <h1 style={{ margin: 0 }}>{getTitle()}</h1>
      <FontAwesomeIcon
        icon={faRightFromBracket}
        onClick={logout}
        className="logout-btn fa-icon"
        title="Logout"
        style={{
          cursor: "pointer",
          fontSize: location.pathname === "/admin" ? "2rem" : "2rem",
          color: location.pathname === "/admin" ? "#76757a" : "#000",
        }}
      />
    </header>
  );
};

// App komponenta
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main style={{ maxHeight: "85vh", overflowY: "auto", padding: "20px" }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminPanel />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
