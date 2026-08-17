import { useState, useEffect } from "react";
import { PaymentPage } from "./components/PaymentPage";
import { getLocalDateString, getMinCheckOutDate, calculateNights } from "./utils/dates";

export function ReceptionBooking() {
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState("form");
  const [createdBooking, setCreatedBooking] = useState(null);

  const todayStr = getLocalDateString();
  const defaultCheckOutStr = getLocalDateString(1);

  const [formData, setFormData] = useState({
    roomType: "Standard",
    checkIn: todayStr,
    checkOut: defaultCheckOutStr,
    name: "",
    phone: "",
    guests: 2,
    email: "",
    specialRequests: "walk-in"
  });

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
      setError(err?.message || "Network error. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("reception_allowed");
    setAllowed(false);
    setPassword("");
    setStep("form");
    setCreatedBooking(null);
    setFormData({
      roomType: "Standard",
      checkIn: todayStr,
      checkOut: defaultCheckOutStr,
      name: "",
      phone: "",
      guests: 2,
      email: "",
      specialRequests: "walk-in"
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "checkIn") {
      const minCheckOut = getMinCheckOutDate(value);
      setFormData((prev) => ({
        ...prev,
        checkIn: value,
        checkOut: !prev.checkOut || new Date(prev.checkOut) <= new Date(value) ? minCheckOut : prev.checkOut
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "guests" ? Number(value) : value
      }));
    }
  };

  const handleContinueToPayment = async (e) => {
    e.preventDefault();
    setMessage("");
    
    if (createdBooking) {
      setStep("payment");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/book-walkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setCreatedBooking({ bookingId: data.bookingId, bookingCode: data.bookingCode });
        setStep("payment");
      } else {
        setMessage("Error: " + (data.error || "Failed to create walk-in booking"));
      }
    } catch (err) {
      setMessage("Error: " + (err?.message || "Network error. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="premium-container admin-card text-center">
        <h2 className="serif">Reception Access</h2>
        <p>Checking access…</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="premium-container admin-card">
        <h2 className="serif text-center mb-4">Reception Login</h2>
        <p className="text-center mb-6" style={{ opacity: 0.8 }}>Enter the reception password to access walk-in booking.</p>

        {error && (
          <p style={{ color: "#ff4d4d", marginBottom: "1rem", textAlign: "center", fontWeight: "600" }}>{error}</p>
        )}

        <form onSubmit={handleLogin}>
          <div className="gold-input-group">
            <label className="gold-label">Password</label>
            <input
              type="password"
              className="gold-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
            />
          </div>

          <button type="submit" className="gold-button">
            Login
          </button>
        </form>

        <p className="text-center mt-4" style={{ fontSize: "12px", opacity: 0.6 }}>
          This page is for Satyam Residency staff only.
        </p>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <PaymentPage
        bookingId={createdBooking?.bookingId}
        bookingCode={createdBooking?.bookingCode}
        bookingData={formData}
        amount={0}
        onBack={() => setStep("form")}
        onSuccess={(_data) => {
          setMessage(`Payment completed successfully. Booking Code: ${createdBooking?.bookingCode || createdBooking?.bookingId}`);
          setStep("form");
          setCreatedBooking(null);
          setFormData({
            roomType: "Standard",
            checkIn: todayStr,
            checkOut: defaultCheckOutStr,
            name: "",
            phone: "",
            guests: 2,
            email: "",
            specialRequests: "walk-in"
          });
        }}
      />
    );
  }
  return (
    <div className="premium-container admin-card" style={{ maxWidth: 650 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '24px' }}>
        <h2 className="serif" style={{ margin: 0, fontSize: '28px' }}>Create Walk‑in Booking</h2>
        <button className="btn-small-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {message && (
        <div style={{
          padding: '12px',
          marginBottom: '24px',
          borderRadius: '8px',
          border: `1px solid ${message.includes("Error") ? "#ff4d4d" : "#4CAF50"}`,
          background: message.includes("Error") ? "rgba(255, 77, 77, 0.1)" : "rgba(76, 175, 80, 0.1)",
          color: message.includes("Error") ? "#ff4d4d" : "#4CAF50",
          fontWeight: '600'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleContinueToPayment}>
        <div className="gold-input-group">
          <label className="gold-label">Room Type</label>
          <select name="roomType" className="gold-input" value={formData.roomType} onChange={handleChange} required>
            <option value="" style={{ color: "#000" }}>Select room type</option>
            <option value="Standard" style={{ color: "#000" }}>Standard</option>
            <option value="Deluxe" style={{ color: "#000" }}>Deluxe</option>
            <option value="Suite" style={{ color: "#000" }}>Suite</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="gold-input-group">
            <label className="gold-label">Check‑in Date</label>
            <input
              type="date"
              className="gold-input"
              name="checkIn"
              value={formData.checkIn}
              onChange={handleChange}
              min={todayStr}
              required
            />
          </div>
          <div className="gold-input-group">
            <label className="gold-label">Check‑out Date</label>
            <input
              type="date"
              className="gold-input"
              name="checkOut"
              value={formData.checkOut}
              onChange={handleChange}
              min={getMinCheckOutDate(formData.checkIn)}
              required
            />
          </div>
        </div>

        <div className="gold-input-group">
          <label className="gold-label">Guest Name</label>
          <input type="text" className="gold-input" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="gold-input-group">
            <label className="gold-label">Guest Email</label>
            <input type="email" className="gold-input" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" />
          </div>
          <div className="gold-input-group">
            <label className="gold-label">Guest Phone</label>
            <input type="tel" className="gold-input" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" required />
          </div>
        </div>

        <div className="gold-input-group">
          <label className="gold-label">Number of Guests</label>
          <input type="number" className="gold-input" name="guests" min="1" max="6" value={formData.guests} onChange={handleChange} />
        </div>

        {/* Dynamic Stay Calculation Preview */}
        {formData.checkIn && formData.checkOut && new Date(formData.checkOut) > new Date(formData.checkIn) && (
          <div style={{ background: 'rgba(20,20,20,0.8)', border: '1px solid rgba(201,168,76,0.3)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            <strong>Stay:</strong> {calculateNights(formData.checkIn, formData.checkOut)} Night(s) &bull; Occupancy: {formData.guests} Guest(s) {formData.guests > 2 ? `(+ ₹400/nt extra guest)` : ''}
          </div>
        )}

        <div className="gold-input-group">
          <label className="gold-label">Special Requests</label>
          <textarea
            className="gold-input"
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            rows={3}
            placeholder="Any special requests or notes..."
          />
        </div>

        <button type="submit" className="gold-button" disabled={loading}>
          {loading ? "Creating Booking..." : "Continue to Payment"}
        </button>
      </form>
    </div>
  );
}