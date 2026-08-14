import React, { useState, useEffect } from 'react';
import { config } from '../config';

/* ────────────────────────────────────────────────────
 *  Legal page content – DPDP Act 2023 compliant
 *  for an Indian hotel booking website.
 * ──────────────────────────────────────────────────── */

const LEGAL_CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: '14 August 2026',
    sections: [
      {
        heading: '1. Introduction',
        body: `${config.hotel.name} ("we", "us", or "our") is committed to protecting your personal data in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and all applicable Indian laws. This Privacy Policy explains how we collect, use, store, and protect your personal data when you use our website and booking services.\n\nFor the purposes of the DPDP Act, ${config.hotel.name} acts as the "Data Fiduciary" and you, the user, are the "Data Principal".`
      },
      {
        heading: '2. Data We Collect',
        body: `We collect the following categories of personal data:\n\n• Full Name – to identify you and process your booking\n• Email Address – to send booking confirmations and communicate with you\n• Phone Number – to contact you regarding your reservation\n• Check-in/Check-out Dates – to process your room booking\n• Number of Guests – to allocate appropriate accommodation\n• Payment Information – to process your payment (handled by secure third-party payment gateways; we do not store card details on our servers)\n• Device & Browser Information – for website functionality and security purposes`
      },
      {
        heading: '3. Purpose of Data Collection',
        body: `We process your personal data strictly for the following purposes:\n\n• Processing and confirming your hotel room booking\n• Communicating booking details, updates, and check-in information\n• Responding to your queries and providing customer support\n• Complying with legal obligations (e.g., guest registration under applicable laws)\n• Improving our services and website experience\n\nWe will NOT use your data for any purpose beyond what is stated above without obtaining your separate, explicit consent.`
      },
      {
        heading: '4. Consent',
        body: `Under the DPDP Act, we obtain your free, specific, informed, and unambiguous consent before processing your personal data. By checking the consent checkbox during sign-up and proceeding to use our services, you consent to the collection and processing of your data as described in this policy.\n\nYou may withdraw your consent at any time by contacting our Grievance Officer (details below). Please note that withdrawal of consent may affect our ability to provide booking services to you.`
      },
      {
        heading: '5. Your Rights as a Data Principal',
        body: `Under the DPDP Act 2023, you have the following rights:\n\n• Right to Access – You can request information about what personal data we hold about you and how it is being processed.\n• Right to Correction – You can request correction of any inaccurate or incomplete personal data.\n• Right to Erasure – You can request deletion of your personal data, subject to legal retention requirements.\n• Right to Grievance Redressal – You can file a complaint regarding the processing of your data.\n• Right to Nominate – You can nominate another person to exercise your rights in case of your death or incapacity.\n\nTo exercise any of these rights, please contact our Grievance Officer.`
      },
      {
        heading: '6. Data Retention',
        body: `We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected:\n\n• Booking records: Retained for 3 years from check-out date for legal and accounting compliance\n• Contact information: Retained until you request deletion or withdraw consent\n• Payment records: Retained as per Reserve Bank of India and Income Tax regulations\n\nOnce the retention period expires, your data is securely deleted or anonymised.`
      },
      {
        heading: '7. Data Security',
        body: `We implement reasonable security safeguards as mandated by the DPDP Act to protect your data, including:\n\n• Encrypted data transmission (HTTPS/TLS)\n• Secure database storage with access controls\n• Regular security assessments\n• Limited employee access on a need-to-know basis\n\nIn the event of a data breach, we will notify the Data Protection Board of India and affected users as required by the DPDP Act.`
      },
      {
        heading: '8. Third-Party Sharing',
        body: `We may share your data with:\n\n• Payment gateways (for processing transactions securely)\n• Cloud service providers (for hosting and data storage)\n• Government authorities (when required by law, e.g., Foreigners Regional Registration Office for international guests)\n\nAll third-party processors are contractually obligated to handle your data in compliance with the DPDP Act. We do NOT sell your data to any third party.`
      },
      {
        heading: '9. Children\'s Data',
        body: `Our services are not directed at individuals under 18 years of age. We do not knowingly collect data from minors without verifiable parental consent, in compliance with the DPDP Act. If we become aware that we have collected data from a minor without proper consent, we will take steps to delete it promptly.`
      },
      {
        heading: '10. Cookies',
        body: `We use essential cookies to ensure our website functions properly. We do not use tracking or advertising cookies. For more details, please refer to our Cookie Policy accessible from the footer of our website.`
      },
      {
        heading: '11. Grievance Officer',
        body: `In compliance with the DPDP Act, we have appointed a Grievance Officer to address your privacy concerns:\n\nName: ${config.hotel.ownerName}\nEmail: ${config.hotel.email}\nPhone: ${config.hotel.phone}\nAddress: ${config.hotel.address}\n\nWe will acknowledge your grievance within 24 hours and resolve it within 15 days. If you are not satisfied with our resolution, you may file a complaint with the Data Protection Board of India.`
      },
      {
        heading: '12. Changes to This Policy',
        body: `We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy periodically.`
      }
    ]
  },

  terms: {
    title: 'Terms & Conditions',
    lastUpdated: '14 August 2026',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: `By accessing and using the ${config.hotel.name} website and booking services, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.`
      },
      {
        heading: '2. Booking & Reservation',
        body: `• All bookings are subject to room availability at the time of confirmation.\n• A booking is confirmed only after you receive a confirmation with a Booking ID.\n• Room rates are displayed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise.\n• The hotel reserves the right to modify room rates without prior notice. However, confirmed bookings will be honoured at the booked rate.\n• Check-in time: 12:00 PM (Noon) | Check-out time: 11:00 AM\n• Early check-in or late check-out is subject to availability and may incur additional charges.`
      },
      {
        heading: '3. Guest Identification',
        body: `• All guests must present valid government-issued photo identification at check-in (Aadhaar, Passport, Driving Licence, or Voter ID).\n• Foreign nationals must present a valid passport and visa, and registration with FRRO may be required.\n• The hotel reserves the right to deny check-in if valid identification is not provided.`
      },
      {
        heading: '4. Payment Terms',
        body: `• Payment can be made via UPI, Credit/Debit Card, Net Banking, Digital Wallets, or Pay at Hotel.\n• For online payments, the transaction is processed through secure third-party payment gateways.\n• The hotel is not responsible for any charges levied by your bank or payment provider.\n• For "Pay at Hotel" bookings, a valid card guarantee may be required to hold the reservation.`
      },
      {
        heading: '5. Cancellation & Refund',
        body: `Please refer to our separate Refund & Cancellation Policy for detailed information on cancellations, modifications, and refund timelines.`
      },
      {
        heading: '6. Guest Conduct',
        body: `• Guests are expected to maintain decorum and respect other guests and staff.\n• Smoking is prohibited in non-designated areas.\n• The hotel is not responsible for loss or damage to personal belongings left in the room.\n• Any damage to hotel property by the guest will be charged to the guest's account.\n• The hotel reserves the right to refuse service or evict any guest engaging in illegal, disruptive, or unsafe behaviour.`
      },
      {
        heading: '7. Liability',
        body: `• The hotel shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.\n• The hotel's total liability shall not exceed the total booking amount paid.\n• The hotel is not liable for disruptions caused by force majeure events (natural disasters, pandemics, government orders, etc.).`
      },
      {
        heading: '8. Intellectual Property',
        body: `All content on this website, including text, graphics, logos, and software, is the property of ${config.hotel.name} and is protected under Indian copyright and trademark laws. Unauthorised reproduction or distribution is prohibited.`
      },
      {
        heading: '9. Governing Law & Jurisdiction',
        body: `These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Rayagada, Odisha.`
      },
      {
        heading: '10. Contact',
        body: `For any queries regarding these Terms & Conditions, please contact us at:\n\nEmail: ${config.hotel.email}\nPhone: ${config.hotel.phone}\nAddress: ${config.hotel.address}`
      }
    ]
  },

  refund: {
    title: 'Refund & Cancellation Policy',
    lastUpdated: '14 August 2026',
    sections: [
      {
        heading: '1. Cancellation by Guest',
        body: `• Cancellations made more than 48 hours before the check-in date: Full refund (minus any payment gateway charges).\n• Cancellations made between 24–48 hours before check-in: 50% of the booking amount will be charged.\n• Cancellations made less than 24 hours before check-in or no-show: No refund will be provided.\n• Same-day bookings: Non-refundable.`
      },
      {
        heading: '2. Cancellation by Hotel',
        body: `In the rare event that ${config.hotel.name} needs to cancel a confirmed booking (due to unforeseen circumstances such as maintenance, natural disaster, or overbooking), the guest will receive:\n\n• A full refund of the booking amount, OR\n• An alternative accommodation of equal or higher value at no additional cost (subject to availability).`
      },
      {
        heading: '3. Modification of Booking',
        body: `• Date changes are permitted subject to availability and must be requested at least 24 hours before the original check-in date.\n• Room upgrades/downgrades are subject to availability and rate differences will be adjusted accordingly.\n• Changes to the number of guests may be accommodated without additional charges unless it requires a room category change.`
      },
      {
        heading: '4. Refund Processing',
        body: `• Approved refunds will be processed within 7–10 business days.\n• Refunds will be credited to the original payment method used at the time of booking.\n• For UPI/wallet payments, refunds may take 2–5 business days.\n• For card/net banking payments, refunds may take 5–10 business days depending on the bank.\n• ${config.hotel.name} is not responsible for delays caused by banks or payment intermediaries.`
      },
      {
        heading: '5. Non-Refundable Items',
        body: `The following are non-refundable:\n\n• Bookings marked as "Non-Refundable" at the time of booking\n• Additional services consumed during the stay (room service, laundry, etc.)\n• Damages to hotel property`
      },
      {
        heading: '6. Contact for Refund Queries',
        body: `For cancellation or refund-related queries, please contact:\n\nEmail: ${config.hotel.email}\nPhone: ${config.hotel.phone}\n\nPlease include your Booking ID in all communications for faster processing.`
      }
    ]
  },

  cookies: {
    title: 'Cookie Policy',
    lastUpdated: '14 August 2026',
    sections: [
      {
        heading: '1. What Are Cookies',
        body: `Cookies are small text files stored on your device when you visit a website. They help the website function properly and provide a better user experience.`
      },
      {
        heading: '2. Cookies We Use',
        body: `${config.hotel.name} uses only essential cookies that are strictly necessary for the operation of our website:\n\n• Session cookies – to maintain your login session and booking flow\n• Preference cookies – to remember your language or display preferences\n\nWe do NOT use:\n• Advertising or tracking cookies\n• Third-party analytics cookies\n• Social media tracking pixels`
      },
      {
        heading: '3. Managing Cookies',
        body: `You can control cookies through your browser settings. However, disabling essential cookies may affect the functionality of our website and booking system.\n\nMost browsers allow you to:\n• View what cookies are stored\n• Delete individual or all cookies\n• Block cookies from specific or all websites`
      },
      {
        heading: '4. Updates',
        body: `This Cookie Policy may be updated periodically. Any changes will be reflected on this page with an updated date.`
      }
    ]
  }
};


/* ────────────────────────────────────────────────────
 *  LegalPageViewer – renders a full-screen legal page
 *  matching the existing dark/gold design system.
 * ──────────────────────────────────────────────────── */

export function LegalPageViewer({ pageKey, onClose }) {
  useEffect(() => {
    if (!pageKey) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [pageKey]);

  const page = LEGAL_CONTENT[pageKey];
  if (!page) return null;

  return (
    <div className="legal-overlay">
      <div className="legal-page">
        {/* Header bar */}
        <div className="legal-header">
          <button className="legal-back-btn" onClick={onClose} aria-label="Close">
            ← Back
          </button>
          <span className="legal-header-title">{page.title}</span>
          <span style={{ width: 60 }}></span>{/* spacer for centering */}
        </div>

        {/* Content */}
        <div className="legal-body">
          <h1 className="serif legal-title">{page.title}</h1>
          <p className="legal-updated">Last Updated: {page.lastUpdated}</p>

          {page.sections.map((sec, i) => (
            <section key={i} className="legal-section">
              <h2 className="legal-section-heading">{sec.heading}</h2>
              <div className="legal-section-body">
                {sec.body.split('\n').map((line, j) => (
                  <p key={j} style={{ margin: line.trim() === '' ? '12px 0' : '6px 0' }}>
                    {line}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <div className="legal-footer-note">
            <p>If you have any questions about this {page.title.toLowerCase()}, please contact us at <a href={`mailto:${config.hotel.email}`}>{config.hotel.email}</a>.</p>
            <p style={{ marginTop: 8 }}>© {new Date().getFullYear()} {config.hotel.name}. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ────────────────────────────────────────────────────
 *  CookieConsentBanner – DPDP-compliant cookie banner
 * ──────────────────────────────────────────────────── */

export function CookieConsentBanner({ onOpenLegal }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('satyam_cookie_consent');
    if (!consent) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('satyam_cookie_consent', 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="alert">
      <div className="cookie-banner-content">
        <div className="cookie-banner-icon">🍪</div>
        <div className="cookie-banner-text">
          <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>
            We use essential cookies
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
            This website uses only essential cookies required for the booking system to function. No tracking or advertising cookies are used.{' '}
            <button
              className="cookie-link-btn"
              onClick={() => onOpenLegal('cookies')}
            >
              Learn more
            </button>
          </p>
        </div>
        <button className="btn btn-primary cookie-accept-btn" onClick={accept}>
          Accept
        </button>
      </div>
    </div>
  );
}


/* ────────────────────────────────────────────────────
 *  FooterLegalLinks – links for footer area
 * ──────────────────────────────────────────────────── */

export function FooterLegalLinks({ onOpenLegal }) {
  const links = [
    { key: 'privacy', label: 'Privacy Policy' },
    { key: 'terms', label: 'Terms & Conditions' },
    { key: 'refund', label: 'Refund Policy' },
    { key: 'cookies', label: 'Cookie Policy' },
  ];

  return (
    <div className="footer-legal-links">
      {links.map((link, i) => (
        <React.Fragment key={link.key}>
          <button
            className="footer-legal-btn"
            onClick={() => onOpenLegal(link.key)}
          >
            {link.label}
          </button>
          {i < links.length - 1 && <span className="footer-legal-separator">•</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
