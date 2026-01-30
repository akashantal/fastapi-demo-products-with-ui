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
    console.log("LOGIN SUCCESS:", res.data);

    if (res.data.message === "Login successful") {
      localStorage.setItem("isLoggedIn", "true");
      onLogin(); 
      navigate("/products"); 
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
        <button type="button" onClick={onShowRegister}>Register</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
    
  );
}

export default Login;
