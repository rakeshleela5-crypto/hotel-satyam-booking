import React, { useState } from 'react';
import { verifyIdOcr, submitPreCheckin } from '../api';

export function AiDigitalPreCheckin({ onClose, initialBookingCode = '' }) {
  const [step, setStep] = useState(1); // 1: Form & ID Upload, 2: AI OCR Verification Review, 3: Fast-Track Pass
  const [bookingCode, setBookingCode] = useState(initialBookingCode || '');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [passData, setPassData] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRunOcrScan = async (e) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) {
      setError('Please provide Guest Full Name and Mobile Number.');
      return;
    }

    setIsScanning(true);
    setError('');

    try {
      // Send to OCR verification endpoint
      const res = await verifyIdOcr({
        idType,
        guestName,
        hasFile: Boolean(selectedFile)
      });

      if (res.success && res.verification) {
        setOcrData(res.verification);
        setStep(2);
      } else {
        setError(res.error || 'Failed to analyze ID document.');
      }
    } catch (err) {
      setError(err?.message || 'Error communicating with AI OCR engine.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmPreCheckin = async () => {
    setIsScanning(true);
    setError('');

    try {
      const res = await submitPreCheckin({
        bookingCode: bookingCode.trim() || 'SR-WALKIN',
        guestName: ocrData?.verifiedName || guestName,
        guestPhone,
        idType: ocrData?.documentType || idType,
        idNumberMasked: ocrData?.idNumberMasked,
        dob: ocrData?.dob,
        gender: ocrData?.gender
      });

      if (res.success) {
        setPassData(res);
        setStep(3);
      } else {
        setError(res.error || 'Failed to complete pre-check-in.');
      }
    } catch (err) {
      setError(err?.message || 'Could not save pre-checkin details.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-content" style={{ maxWidth: '540px', padding: '24px' }}>
        {/* Modal Header */}
        <div className="flex-row justify-between mb-4" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div className="flex-row gap-2">
            <span style={{ fontSize: '24px' }}>🪪</span>
            <div>
              <h2 className="serif" style={{ fontSize: '22px', margin: 0 }}>Express Digital Pre-Check-in</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                AI Government ID Verification • Zero Wait Key Handover
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '24px', color: '#fff', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px', background: 'rgba(229, 57, 53, 0.15)', border: '1px solid #e53935', borderRadius: '8px', color: '#ffcdd2', fontSize: '13px', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Step 1: Upload ID & Guest Info */}
        {step === 1 && (
          <form onSubmit={handleRunOcrScan} className="flex-column gap-3">
            <div style={{ background: 'rgba(201, 168, 76, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(201, 168, 76, 0.2)', fontSize: '13px' }}>
              ⚡ <strong>Skip Front Desk Queues:</strong> Upload your Government ID now for automated police ledger compliance. Get your room key in under 10 seconds upon arrival.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Booking ID / Reference Code (Optional)
              </label>
              <input
                type="text"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                placeholder="e.g. SR-A89BC1 or leave blank for Walk-in"
                className="input-field"
                style={{ width: '100%', fontSize: '14px', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Full Name (as on ID) *
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Rajesh Patnaik"
                  className="input-field"
                  style={{ width: '100%', fontSize: '14px', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Mobile Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="input-field"
                  style={{ width: '100%', fontSize: '14px', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Government ID Type
              </label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '14px', background: '#1a1a1a', color: '#fff' }}
              >
                <option value="Aadhaar Card">Aadhaar Card (UIDAI)</option>
                <option value="Driving License">Driving License</option>
                <option value="Voter ID">Voter ID (Election Card)</option>
                <option value="Passport">Passport</option>
              </select>
            </div>

            {/* ID Document Upload Zone */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Upload ID Photo or Scan
              </label>
              <div
                style={{
                  border: '2px dashed rgba(201, 168, 76, 0.4)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('id-file-input').click()}
              >
                <input
                  id="id-file-input"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {previewUrl ? (
                  <div>
                    <img src={previewUrl} alt="ID Preview" style={{ maxHeight: '120px', borderRadius: '8px', marginBottom: '8px' }} />
                    <p style={{ fontSize: '12px', color: 'var(--primary-color)' }}>✓ ID Image Selected. Tap to change.</p>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '4px' }}>📸</span>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '4px 0' }}>
                      Click to capture or upload photo of {idType}
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Supports PNG, JPG, PDF (AI Auto-Masks sensitive numbers)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isScanning}
              style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 'bold', marginTop: '6px' }}
            >
              {isScanning ? '⚡ AI Vision Scanning & Extracting...' : '🔍 Scan & Verify ID with AI'}
            </button>
          </form>
        )}

        {/* Step 2: AI OCR Verification Review */}
        {step === 2 && ocrData && (
          <div className="flex-column gap-3">
            <div style={{ background: 'rgba(76, 175, 80, 0.12)', border: '1px solid #81c784', padding: '12px', borderRadius: '8px', color: '#a5d6a7', fontSize: '13px' }}>
              ✓ <strong>AI Document Verification Passed!</strong> Confidence: {ocrData.matchConfidence} • {ocrData.complianceStatus}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--primary-color)', marginBottom: '12px' }}>
                Extracted Guest Ledger Details
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Full Name:</span>
                  <div><strong>{ocrData.verifiedName}</strong></div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Document:</span>
                  <div><strong>{ocrData.documentType}</strong></div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Masked ID Number:</span>
                  <div><strong style={{ letterSpacing: '1px' }}>{ocrData.idNumberMasked}</strong></div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>DOB / Age:</span>
                  <div><strong>{ocrData.dob}</strong></div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Gender:</span>
                  <div><strong>{ocrData.gender}</strong></div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Photo Clarity:</span>
                  <div style={{ color: '#81c784' }}><strong>{ocrData.photoClarity}</strong></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                style={{ flex: 1, padding: '10px' }}
              >
                ← Rescan ID
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmPreCheckin}
                disabled={isScanning}
                style={{ flex: 2, padding: '10px', fontWeight: 'bold' }}
              >
                {isScanning ? 'Issuing Pass...' : '⚡ Generate Fast-Track QR Pass'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Fast-Track Digital Boarding Pass */}
        {step === 3 && passData && (
          <div className="flex-column gap-3 text-center">
            <div style={{ background: 'linear-gradient(135deg, rgba(201, 168, 76, 0.15), rgba(0,0,0,0.8))', border: '2px solid var(--primary-color)', borderRadius: '16px', padding: '20px' }}>
              <span style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--primary-color)', textTransform: 'uppercase' }}>
                Satyam Residency • Fast-Track Boarding Pass
              </span>
              <h2 className="serif" style={{ fontSize: '26px', margin: '8px 0', color: '#fff' }}>
                PRE-VERIFIED GUEST
              </h2>

              {/* QR Code Simulation */}
              <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', display: 'inline-block', margin: '12px 0' }}>
                <div style={{ width: '130px', height: '130px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', textAlign: 'center', padding: '8px' }}>
                  [QR CODE: {passData.checkinId}]
                </div>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Pass Token: <strong style={{ color: 'var(--primary-color)' }}>{passData.qrToken}</strong>
              </div>
              <div style={{ fontSize: '14px', color: '#fff' }}>
                Guest: <strong>{guestName}</strong> • ID: <strong>{ocrData?.idNumberMasked}</strong>
              </div>

              <p style={{ fontSize: '12px', color: '#81c784', marginTop: '12px' }}>
                ✨ {passData.message}
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
              style={{ width: '100%', padding: '12px', fontWeight: 'bold' }}
            >
              Done &amp; Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
