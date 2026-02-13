import { useState } from "react";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);

  const [editId, setEditId] = useState(null);
  const [dark, setDark] = useState(false);
  const [message, setMessage] = useState("");

  const showMessage = msg => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2000);
  };

  const register = async () => {
    if (!username.trim() || !password.trim()) {
      showMessage("Username & password required!");
      return;
    }

    const res = await fetch("http://localhost:3001/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const txt = await res.text();
    showMessage(txt);
  };

  const login = async () => {
    if (!username.trim() || !password.trim()) {
      showMessage("Enter username & password!");
      return;
    }

    const res = await fetch("http://localhost:3001/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data) {
      setUser(data);
      loadNotes(data.id);
    } else {
      showMessage("Wrong credentials!");
    }
  };

  const loadNotes = async id => {
    const res = await fetch(`http://localhost:3001/notes?user=${id}`);
    setNotes(await res.json());
  };

  const addOrUpdateNote = async () => {
    if (!title.trim() || !note.trim()) return;

    if (editId) {
      await fetch("http://localhost:3001/delete-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId })
      });
    }

    await fetch("http://localhost:3001/add-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        content: `${title}|${note}`
      })
    });

    setTitle("");
    setNote("");
    setEditId(null);
    loadNotes(user.id);
  };

  const editNote = n => {
    const [t, c] = n.content.split("|");
    setTitle(t);
    setNote(c);
    setEditId(n.id);
  };

  const deleteNote = async id => {
    await fetch("http://localhost:3001/delete-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    loadNotes(user.id);
  };

  if (!user) {
    return (
      <div className={dark ? "auth-page dark" : "auth-page"}>
        <header className="auth-header">
          <h2>📒 Notes App</h2>
          <button onClick={() => setDark(!dark)}>
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
        </header>

        <div className="auth-wrapper">
          <div className="auth-card">
            <h1>Welcome</h1>

            <input
              placeholder="Username"
              onChange={e => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              onChange={e => setPassword(e.target.value)}
            />

            <div className="auth-buttons">
              <button onClick={login}>Login</button>
              <button onClick={register}>Register</button>
            </div>

            {message && <p>{message}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={dark ? "app dark" : "app"}>
      <header className="header">
        <h2>📒 Notes App</h2>
        <div>
          <button onClick={() => setDark(!dark)}>
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={() => setUser(null)}>Logout</button>
        </div>
      </header>

      <div className="create-box">
        <input
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          placeholder="Write your note..."
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <button onClick={addOrUpdateNote}>
          {editId ? "Update" : "Add"}
        </button>
      </div>

      <div className="notes-grid">
        {notes.map(n => {
          const [t, c] = n.content.split("|");
          return (
            <div key={n.id} className="note-card">
              <strong>{t}</strong>
              <p>{c}</p>
              <div className="card-actions">
                <button onClick={() => editNote(n)}>Edit</button>
                <button onClick={() => deleteNote(n.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;