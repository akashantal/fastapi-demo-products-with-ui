import { useState } from "react";
import { api } from "./App";

function Register({ onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

const handleRegister = async (e) => {
  e.preventDefault();
  setError("");
  try {
    await api.post("/register", { username, password });
    alert("User registered! Please login now.");
    onRegister(); // switches back to login form
  } catch (err) {
    console.log(err); // 👈 optional: see full error
    setError(err.response?.data?.detail || "Registration failed");
  }
};


  return (
    <form onSubmit={handleRegister}>
      <h2>Register</h2>
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
      <button type="submit">Register</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

export default Register;
