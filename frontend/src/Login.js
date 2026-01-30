import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Authorization removed — simply navigate to app
    navigate("/");
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Login (disabled)</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input type="password" placeholder="Password" required />
      <button type="submit">Enter App</button>
    </form>
  );
}

export default Login;
