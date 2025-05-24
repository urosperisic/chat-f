import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPaperPlane } from "@fortawesome/free-solid-svg-icons";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

    const wsProtocol = API_BASE.startsWith("https") ? "wss" : "ws";
    const wsUrl = `${wsProtocol}://${API_BASE.replace(
      /^https?:\/\//,
      ""
    )}/ws/messages?token=${token}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => console.log("✅ WebSocket connected");

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

    ws.current.onclose = (event) =>
      console.log("⚠️ WebSocket disconnected", event.code, event.reason);

    ws.current.onerror = (error) => console.error("WebSocket error", error);

    fetch(`${API_BASE}/messages/`, {
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
      alert("❌ WebSocket is not connected");
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this message?"))
      return;

    fetch(`${API_BASE}/messages/${id}`, {
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

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yy} ${hh}:${min}`;
  };

  return (
    <main>
      {messages.map((msg) => {
        const isCurrentUser = msg.owner.id === currentUserId;
        return (
          <div
            className={`msg ${isCurrentUser ? "current-user" : ""}`}
            key={msg.id}
          >
            <small>
              <span
                className={`test-user ${isCurrentUser ? "current-user" : ""}`}
              >
                {msg.owner.first_name[0]} {msg.owner.last_name[0]}
              </span>{" "}
              {formatDate(msg.timestamp)}
            </small>

            <div className="msg-bubble">
              {msg.content}
              {isCurrentUser && (
                <FontAwesomeIcon
                  icon={faTrash}
                  onClick={() => handleDelete(msg.id)}
                  className="fa-icon delete-icon"
                  title="Delete message"
                />
              )}
            </div>
          </div>
        );
      })}

      <div ref={messagesEndRef} />

      <form onSubmit={handleSend} className="message-form">
        <label htmlFor="new-message">New Message</label>
        <input
          id="new-message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="fa-icon send-msg-icon"
          title="Send message"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </main>
  );
}

export default Home;
