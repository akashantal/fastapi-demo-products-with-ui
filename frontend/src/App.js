import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./App.css";

const api = axios.create({
  baseURL: "http://localhost:30007", // Update with your FastAPI backend URL (NodePort -> backend)
});

function App() {
  const [products, setProducts] = useState([]);
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

  // New: cart state -> { [productId]: quantity }
  const [cart, setCart] = useState({});

  // Dark mode
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Fetch products on mount
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
    fetchProducts();
  }, []);

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
    // remove from cart if present
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
    fetchProducts();
  };

  const handleEdit = (p) => {
    setForm({ ...p });
    setEditId(p.id);
  };

  // Cart helpers
  const toggleSelect = (id) => {
    setCart((c) => {
      const next = { ...c };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = 1;
      }
      return next;
    });
  };

  const setQty = (id, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    setCart((c) => ({ ...c, [id]: q }));
  };

  const handleCheckout = async () => {
    const items = Object.entries(cart).map(([product_id, quantity]) => ({
      product_id: Number(product_id),
      quantity: Number(quantity),
    }));
    if (!items.length) {
      setError("Cart is empty");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await api.post("/checkout", { items });
      setMessage(`Order ${res.data.order_id} — total $${res.data.total.toFixed(2)}`);
      // clear cart after successful checkout
      setCart({});
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.detail || "Checkout failed");
    }
    setLoading(false);
  };

  return (
    <div className="app-bg">
      <header className="topbar">
        <h1>📦 Akash Website</h1>
        <button onClick={() => setDarkMode((d) => !d)}>
          {darkMode ? "☀️" : "🌙"}
        </button>
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

      <div style={{ padding: 12 }}>
        <button className="btn" onClick={handleCheckout}>Checkout ({Object.keys(cart).length})</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="product-list">
          <table className="product-table">
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>In Stock</th>
                <th>Qty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const selected = Boolean(cart[p.id]);
                return (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelect(p.id)}
                      />
                    </td>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>${Number(p.price).toFixed(2)}</td>
                    <td>{p.in_stock ? "Yes" : "No"}</td>
                    <td>
                      {selected ? (
                        <input
                          style={{ width: 60 }}
                          type="number"
                          min="1"
                          value={cart[p.id]}
                          onChange={(e) => setQty(p.id, e.target.value)}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <button className="btn btn-edit" onClick={() => handleEdit(p)}>Edit</button>
                      <button className="btn btn-delete" onClick={() => handleDelete(p.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export { api };
export default App;

