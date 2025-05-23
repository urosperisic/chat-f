import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    country: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/auth/register`, form, {
        headers: { "Content-Type": "application/json" },
      });
      navigate("/login");
    } catch (err) {
      console.error(err.response?.data);
      alert("Registration failed");
    }
  };

  return (
    <>
      <form onSubmit={handleRegister}>
        <input name="email" onChange={handleChange} placeholder="Email" />
        <input
          name="password"
          type="password"
          onChange={handleChange}
          placeholder="Password"
        />
        <input
          name="first_name"
          onChange={handleChange}
          placeholder="First Name"
        />
        <input
          name="last_name"
          onChange={handleChange}
          placeholder="Last Name"
        />
        <input name="country" onChange={handleChange} placeholder="Country" />
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </>
  );
}

export default Register;
