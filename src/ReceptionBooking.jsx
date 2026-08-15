import { useState, useEffect } from "react";

export function ReceptionBooking() {
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Check if already logged in this session (optional convenience)
  useEffect(() => {
    const isLogged = localStorage.getItem("reception_allowed") === "1";
    if (isLogged) {
      setAllowed(true);
    }
    setChecking(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setChecking(true);

    try {
      const res = await fetch("/api/check-reception-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (data.allowed) {
        setAllowed(true);
        localStorage.setItem("reception_allowed", "1");
      } else {
        setError("Incorrect password.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("reception_allowed");
    setAllowed(false);
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const form = e.target;
    const payload = {
      roomType: form.roomType.value,
      checkIn: form.checkIn.value,
      checkOut: form.checkOut.value,
      name: form.name.value,
      phone: form.phone.value,
      guests: Number(form.guests.value) || 1,
      notes: "walk-in",
    };

    try {
      const res = await fetch("/api/book-walkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("Walk-in booking created successfully.");
        form.reset();
      } else {
        setMessage("Error: " + (data.error || "Failed to create booking"));
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ maxWidth: 400, margin: "3rem auto", padding: "1rem", textAlign: "center" }}>
        <h2>Reception Access</h2>
        <p>Checking access…</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div style={{ maxWidth: 400, margin: "3rem auto", padding: "1rem" }}>
        <h2>Reception Login</h2>
        <p>Enter the reception password to access walk‑in booking.</p>

        {error && (
          <p style={{ color: "red", marginBottom: "0.5rem" }}>{error}</p>
        )}

        <form onSubmit={handleLogin} style={{ display: "grid", gap: "0.75rem" }}>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </label>

          <button type="submit" style={{ padding: "0.5rem" }}>
            Login
          </button>
        </form>

        <p style={{ fontSize: "12px", opacity: 0.7, marginTop: "1rem" }}>
          This page is for Satyam Residency staff only.
        </p>
      </div>
    );
  }

  // Logged in: show the booking form
  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Reception – Create Walk‑in Booking</h2>
        <button onClick={handleLogout} style={{ fontSize: "12px" }}>
          Logout
        </button>
      </div>
      {message && (
        <p style={{ marginBottom: "1rem", color: message.includes("Error") ? "red" : "green" }}>
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          Room Type
          <select name="roomType" required>
            <option value="">Select room type</option>
            <option value="Standard">Standard</option>
            <option value="Deluxe">Deluxe</option>
            <option value="Suite">Suite</option>
          </select>
        </label>

        <label>
          Check‑in Date
          <input type="date" name="checkIn" required />
        </label>

        <label>
          Check‑out Date
          <input type="date" name="checkOut" required />
        </label>

        <label>
          Guest Name
          <input type="text" name="name" required />
        </label>

        <label>
          Guest Phone
          <input type="tel" name="phone" />
        </label>

        <label>
          Number of Guests
          <input type="number" name="guests" min="1" defaultValue="1" />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Walk‑in Booking"}
        </button>
      </form>
    </div>
  );
}