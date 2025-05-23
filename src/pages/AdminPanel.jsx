import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

const API_BASE = import.meta.env.VITE_API_URL;

function AdminPanel() {
  const { user, token, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === "admin" && token) {
      const fetchUsers = async () => {
        try {
          const res = await axios.get(`${API_BASE}/auth/users`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setUsers(res.data);
        } catch (err) {
          console.error("Failed to load users", err);
        } finally {
          setLoading(false);
        }
      };

      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`${API_BASE}/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Failed to delete user", err);
      alert("Delete failed");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Admin Panel</h1>
      <FontAwesomeIcon
        icon={faRightFromBracket}
        onClick={logout}
        className="logout-btn fa-icon"
        title="Logout"
        style={{ cursor: "pointer", fontSize: "2rem", color: "#76757a" }}
      />

      <ul style={{ marginTop: "1rem" }}>
        {users.map((u) => (
          <li key={u.id}>
            {u.email} ({u.role}){" "}
            {u.role !== "admin" && (
              <button onClick={() => handleDelete(u.id)}>Delete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminPanel;
