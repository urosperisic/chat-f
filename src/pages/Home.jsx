import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faPaperPlane,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1];
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function Home() {
  const { token, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const ws = useRef(null);

  // Ref za scroll na kraj
  const messagesEndRef = useRef(null);

  const currentUser = token ? parseJwt(token) : null;
  const currentUserId = currentUser?.sub;

  useEffect(() => {
    if (!token || typeof token !== "string" || token.split(".").length !== 3) {
      console.warn(
        "WebSocket not initialized — invalid or missing token:",
        token
      );
      return;
    }

    ws.current = new WebSocket(
      `ws://localhost:8000/ws/messages?token=${token}`
    );

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action === "delete") {
          setMessages((prev) => prev.filter((msg) => msg.id !== data.id));
        } else {
          setMessages((prev) => [...prev, data]);
        }
      } catch (e) {
        console.error("Invalid message format", e, event.data);
      }
    };

    ws.current.onclose = (event) => {
      console.log("WebSocket disconnected", event.code, event.reason);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error", error);
    };

    fetch("http://localhost:8000/messages/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load messages");
        return res.json();
      })
      .then((data) => setMessages(data))
      .catch(() => {
        alert("Failed to load messages");
        logout();
      });

    return () => {
      if (ws.current) {
        ws.current.close(1000, "Component unmounting");
      }
    };
  }, [token]);

  // Scroll na kraj kad se promeni messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(newMessage);
      setNewMessage("");
    } else {
      alert("WebSocket is not connected");
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yy} ${hh}:${min}`;
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this message?"))
      return;

    fetch(`http://localhost:8000/messages/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 204) {
          setMessages((prev) => prev.filter((msg) => msg.id !== id));
        } else if (res.status === 403) {
          alert("You don't have permission to delete this message.");
        } else {
          throw new Error("Failed to delete message");
        }
      })
      .catch((err) => {
        console.error("Error deleting message:", err);
        alert("Failed to delete message.");
      });
  };

  return (
    <div>
      <header></header>

      <h1>Messages (WS)</h1>
      <FontAwesomeIcon
        icon={faRightFromBracket}
        onClick={logout}
        className="logout-btn fa-icon"
        title="Logout"
        style={{ cursor: "pointer", fontSize: "2rem", color: "#76757a" }}
      />

      {messages.map((msg) => (
        <div className="msg" key={msg.id}>
          <small>
            <span
              className={`test-user ${
                msg.owner.id === currentUserId ? "current-user" : ""
              }`}
            >
              {msg.owner.first_name[0]} {msg.owner.last_name[0]}
            </span>{" "}
            {formatDate(msg.timestamp)}
            {msg.owner.id === currentUserId && (
              <FontAwesomeIcon
                icon={faTrash}
                onClick={() => handleDelete(msg.id)}
                style={{
                  marginLeft: "8px",
                  cursor: "pointer",
                  color: "#76757a",
                }}
                className="fa-icon"
                title="Delete message"
              />
            )}
          </small>
          <p className="real-msg">{msg.content}</p>
        </div>
      ))}

      {/* Prazan div za scroll */}
      <div ref={messagesEndRef} />

      <form
        onSubmit={handleSend}
        className="message-form"
        style={{ marginTop: "1rem" }}
      >
        <label htmlFor="new-message">New Message</label>
        <input
          id="new-message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="logout-btn fa-icon"
          title="Send message"
          style={{
            marginLeft: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#76757a",
            padding: 0,
          }}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </div>
  );
}

export default Home;
