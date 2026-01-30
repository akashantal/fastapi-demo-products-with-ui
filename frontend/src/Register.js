import React from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  return (
    <div>
      <h2>Registration disabled</h2>
      <p>User registration is disabled. Click below to continue to the app.</p>
      <button onClick={() => navigate("/")}>Go to App</button>
    </div>
  );
}

export default Register;
