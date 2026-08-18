import React, { useState, useEffect } from 'react';
import { getPreArrivalUpsells, acceptPreArrivalUpsell } from '../api';

export function AiPreArrivalUpsellModal({ onClose, bookingCode = 'SR-8920', roomType = 'Standard Room' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUpgrade, setSelectedUpgrade] = useState(true); // default select room upgrade
  const [selectedAddons, setSelectedAddons] = useState(['early_checkin_slot', 'station_cab_pickup']);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => {
    fetchUpsellOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUpsellOffers = async () => {
    try {
      setLoading(true);
      const res = await getPreArrivalUpsells({ bookingCode, currentRoom: roomType });
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.warn('Failed to load upsell offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAddon = (id) => {
    setSelectedAddons(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Pricing calculation
  const upgradeCost = selectedUpgrade && data?.roomUpgradeOffer?.specialDealPrice ? data.roomUpgradeOffer.specialDealPrice : 0;
  const standardUpgradeCost = selectedUpgrade && data?.roomUpgradeOffer?.standardUpgradePrice ? data.roomUpgradeOffer.standardUpgradePrice : 0;
  
  const addonsCost = (data?.ancillaryAddons || [])
    .filter(a => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + a.dealPrice, 0);

  const addonsOriginalCost = (data?.ancillaryAddons || [])
    .filter(a => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + a.originalPrice, 0);

  const totalCost = upgradeCost + addonsCost;
  const totalOriginal = standardUpgradeCost + addonsOriginalCost;
  const totalSavings = Math.max(0, totalOriginal - totalCost);

  const handleConfirmUpsell = async () => {
    setSubmitting(true);
    try {
      const selectedItems = [];
      if (selectedUpgrade && data?.roomUpgradeOffer) {
        selectedItems.push(`Room Upgrade to ${data.roomUpgradeOffer.targetRoom} (₹${data.roomUpgradeOffer.specialDealPrice})`);
      }
      (data?.ancillaryAddons || []).forEach(a => {
        if (selectedAddons.includes(a.id)) {
          selectedItems.push(`${a.title} (₹${a.dealPrice})`);
        }
      });

      const res = await acceptPreArrivalUpsell({
        bookingCode,
        selectedUpgrades: selectedItems,
        totalAddonCost: totalCost
      });

      if (res.success) {
        setConfirmedOrder(res);
      } else {
        alert(res.error || 'Failed to apply upgrades');
      }
    } catch (err) {
      alert(err?.message || 'Error processing upgrade');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        {/* Header */}
        <div className="flex-row justify-between mb-3" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div className="flex-row gap-2">
            <span style={{ fontSize: '26px' }}>👑</span>
            <div>
              <h2 className="serif" style={{ fontSize: '22px', margin: 0 }}>Smart Pre-Arrival Upgrade Portal</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Exclusive T-24h Deals for Booking <strong>#{bookingCode}</strong>
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--primary-color)' }}>
            ⚡ Checking live room inventory &amp; customized arrival add-ons...
          </div>
        ) : confirmedOrder ? (
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ fontSize: '50px', marginBottom: '14px' }}>✨🎉</div>
            <h3 className="serif" style={{ fontSize: '22px', color: 'var(--primary-color)', marginBottom: '8px' }}>
              Upgrades Confirmed!
            </h3>
            <p style={{ fontSize: '14px', color: '#ddd', marginBottom: '18px' }}>
              {confirmedOrder.message}
            </p>
            <div style={{ background: 'rgba(201, 168, 76, 0.1)', border: '1px solid var(--primary-color)', padding: '16px', borderRadius: '10px', textAlign: 'left', marginBottom: '20px', fontSize: '13px' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '8px' }}>
                Arrival Handover Summary:
              </div>
              <div>• Booking ID: <strong>{bookingCode}</strong></div>
              <div>• Order Reference: <strong>{confirmedOrder.orderId}</strong></div>
              <div>• Upgrade Total: <strong>₹{totalCost.toLocaleString('en-IN')}</strong> (Pay during check-in)</div>
              <div>• Total Savings: <strong style={{ color: '#4CAF50' }}>₹{totalSavings.toLocaleString('en-IN')} (Saved 50%+)</strong></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <a
                href={`https://wa.me/918984938388?text=${encodeURIComponent(`Namaste Satyam Residency! I have confirmed Pre-Arrival Upgrades for Booking ${bookingCode} (Order: ${confirmedOrder.orderId}). Total: ₹${totalCost}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                💬 Open WhatsApp Confirmation
              </a>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* T-24h Urgency Banner */}
            <div style={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.4)', borderRadius: '10px', padding: '10px 14px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>⏱️ <strong>T-24h Micro-Upsell Window:</strong> {data?.deadlineCountdown || 'Limited inventory'}</span>
              <span style={{ background: '#ffc107', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                SAVE UP TO 60%
              </span>
            </div>

            {/* Section 1: Room Upgrade Offer */}
            {data?.roomUpgradeOffer?.eligible && (
              <div
                style={{
                  background: selectedUpgrade ? 'rgba(201, 168, 76, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: selectedUpgrade ? '2px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedUpgrade(!selectedUpgrade)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', background: 'var(--primary-color)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      ⚡ VIP ROOM UPGRADE
                    </span>
                    <h3 className="serif" style={{ margin: '6px 0 2px 0', fontSize: '18px', color: '#fff' }}>
                      Upgrade from {data.roomUpgradeOffer.currentRoom} &rarr; <span style={{ color: 'var(--primary-color)' }}>{data.roomUpgradeOffer.targetRoom}</span>
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Available specifically for your arrival date
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ textDecoration: 'line-through', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      ₹{data.roomUpgradeOffer.standardUpgradePrice}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50' }}>
                      +₹{data.roomUpgradeOffer.specialDealPrice}
                    </div>
                    <span style={{ fontSize: '10px', color: '#4CAF50', fontWeight: 'bold' }}>
                      SAVE {data.roomUpgradeOffer.savingsPercentage}%
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', color: '#ccc', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                  {data.roomUpgradeOffer.upgradeBenefits.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--primary-color)' }}>✓</span> {b}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '12px', textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: selectedUpgrade ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                    {selectedUpgrade ? '✓ Upgrade Selected' : '+ Tap to Select Upgrade'}
                  </span>
                </div>
              </div>
            )}

            {/* Section 2: Contextual Ancillary Add-ons */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '10px' }}>
                🚀 Contextual Pre-Arrival Add-ons:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(data?.ancillaryAddons || []).map((addon) => {
                  const isChecked = selectedAddons.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: isChecked ? 'rgba(201, 168, 76, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        border: isChecked ? '1px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '13px', color: '#fff' }}>{addon.title}</strong>
                            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '4px', color: 'var(--primary-color)' }}>
                              {addon.tag}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {addon.desc}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '70px' }}>
                        <div style={{ textDecoration: 'line-through', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          ₹{addon.originalPrice}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#4CAF50' }}>
                          +₹{addon.dealPrice}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total & Action Bar */}
            <div style={{ background: '#141414', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>
                  Total Upgrade Amount:
                </span>
                <span style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  ₹{totalCost.toLocaleString('en-IN')}
                </span>
                {totalSavings > 0 && (
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#4CAF50', fontWeight: 'bold' }}>
                    (You Save ₹{totalSavings.toLocaleString('en-IN')})
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{ fontSize: '13px' }}
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUpsell}
                  disabled={submitting || totalCost === 0}
                  className="btn btn-primary"
                  style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {submitting ? 'Applying Deals...' : '✨ Apply Pre-Arrival Upgrades'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
