import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./App"; // ✅ import the axios instance

function Login({ onLogin, onShowRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setError("");

    try {
      const res = await api.post("/login", { username, password });

      // store token if provided by backend
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        // set axios default header so subsequent requests include it
        api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      }

      if (res.data.message === "Login successful") {
        localStorage.setItem("isLoggedIn", "true");
        if (onLogin) onLogin(); 
        // navigate to app root (index.js defines "/" for the app)
        navigate("/"); 
      } else {
        setError("Login failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Login failed");
    }
  };


  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
      <button type="button" onClick={() => onShowRegister && onShowRegister()}>Register</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
    
  );
}

export default Login;
