import React from "react";

function ProtectedRoute({ children }) {
  // Authorization removed — always allow access
  return <>{children}</>;
}

export default ProtectedRoute;
