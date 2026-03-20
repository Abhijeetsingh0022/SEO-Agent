import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Shield, CheckCircle, Info } from "lucide-react";
import { PrivacyManager } from "@/lib/dataMinimization";

export function PrivacyNotice() {
  const [showPolicy, setShowPolicy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showPolicy) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showPolicy]);

  const policy = PrivacyManager.createPrivacyNotice();

  const modalContent = (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPolicy(false)}>
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <div className="modal-title-icon">
              <Shield size={16} strokeWidth={2.5} />
            </div>
            {policy.title.replace(/🔒 /, "")}
          </div>
          <button
            className="modal-close"
            onClick={() => setShowPolicy(false)}
            aria-label="Close privacy policy"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {policy.summary.replace(/✅ /g, "").replace(/❌ /g, "")}
        </div>

        {/* Rights */}
        <div className="modal-section-title">Your Rights (GDPR / CCPA)</div>
        <ul className="modal-rights-list">
          {policy.rights.map((right) => (
            <li key={right}>
              <CheckCircle size={14} strokeWidth={2.5} />
              {right}
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="modal-footer">
          <Info size={14} strokeWidth={2} />
          Data automatically expires after 24 hours. No personal identification is stored.
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="privacy-btn"
        onClick={() => setShowPolicy(true)}
        title="View privacy policy"
      >
        <Shield size={12} strokeWidth={2} />
        Privacy
      </button>

      {showPolicy && mounted ? createPortal(modalContent, document.body) : null}
    </>
  );
}
