import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./App.css";
import Login from "./Login";
import ProtectedRoute from "./ProtectedRoute";
import Register from "./Register";
const api = axios.create({
baseURL: "http://fastapi-service:8000"
});

function App() {
  const [products, setProducts] = useState([]);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    id: "",
    name: "",
    price: "",
    in_stock: false,
  });
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  // Add token to axios headers
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, [isLoggedIn]);

  // Dark mode
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/");
      setProducts(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch products");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isLoggedIn) fetchProducts();
  }, [isLoggedIn]);

  // Sort + filter
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    const q = filter.trim().toLowerCase();

    if (q) {
      filtered = filtered.filter(
        (p) =>
          String(p.id).includes(q) ||
          p.name?.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (["id", "price"].includes(sortField)) {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      } else {
        return sortDirection === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      }
    });

    return filtered;
  }, [products, filter, sortField, sortDirection]);

  // Form handlers
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      if (editId) {
        await api.put(`/products/${editId}`, {
          ...form,
          id: Number(form.id),
          price: Number(form.price),
          in_stock: Boolean(form.in_stock),
        });
        setMessage("Product updated");
      } else {
        await api.post("/products/", {
          ...form,
          id: Number(form.id),
          price: Number(form.price),
          in_stock: Boolean(form.in_stock),
        });
        setMessage("Product added");
      }
      setForm({ id: "", name: "", price: "", in_stock: false });
      setEditId(null);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.detail || "Operation failed");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete product?")) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  const handleEdit = (p) => {
    setForm({ ...p });
    setEditId(p.id);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
  return showRegister ? (
    <Register onRegister={() => setShowRegister(false)} />
  ) : (
    <Login
      onLogin={() => setIsLoggedIn(true)}
      onShowRegister={() => setShowRegister(true)} // 🔥 make sure this is here
    />
  );
}




  return (
    <ProtectedRoute>
      <div className="app-bg">
        <header className="topbar">
          <h1>📦 Akash Website</h1>
          <button onClick={() => setDarkMode((d) => !d)}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button onClick={handleLogout}>Logout</button>
        </header>

        <input
          placeholder="Search..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />

        <form onSubmit={handleSubmit}>
          <input name="id" value={form.id} onChange={handleChange} required />
          <input name="name" value={form.name} onChange={handleChange} required />
          <input name="price" value={form.price} onChange={handleChange} required />
          <label>
            <input
              type="checkbox"
              checked={form.in_stock}
              onChange={(e) =>
                setForm({ ...form, in_stock: e.target.checked })
              }
            />
            In Stock
          </label>
          <button type="submit">{editId ? "Update" : "Add"}</button>
        </form>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="product-list">
  <table className="product-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Price</th>
        <th>In Stock</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {products.map((p) => (
        <tr key={p.id}>
          <td>{p.id}</td>
          <td>{p.name}</td>
          <td>${Number(p.price).toFixed(2)}</td>
          <td>{p.in_stock ? "Yes" : "No"}</td>
          <td>
            <button className="btn btn-edit" onClick={() => handleEdit(p)}>Edit</button>
            <button className="btn btn-delete" onClick={() => handleDelete(p.id)}>Delete</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

        )}
      </div>
    </ProtectedRoute>
  );
}

export { api }; // export axios instance
export default App;

