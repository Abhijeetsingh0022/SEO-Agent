"use client";

import { 
  Compass, 
  History, 
  Settings, 
  Layers, 
  PlusCircle, 
  Briefcase,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export default function DashboardNavigation({ steps, stepData, currentStepId, siteUrl }) {
  return (
    <div className="dash-nav-inner">
      {/* Session Header */}
      <div className="nav-header">
        <div className="nav-site-info">
          <p className="nav-site-label">Active Audit</p>
          <p className="nav-site-name" title={siteUrl}>
            {siteUrl ? siteUrl.replace(/^https?:\/\//, '').split('/')[0] : 'Idle'}
          </p>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="nav-section">
        <p className="nav-section-title">Workflow Progress</p>
        <div className="nav-items">
          {steps.map((s) => {
            const status = stepData[s.id]?.status || 'idle';
            const isActive = s.id === currentStepId;
            
            const handleStepClick = () => {
              const element = document.getElementById(`step-card-${s.id}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            };

            return (
              <div 
                key={s.id} 
                className={`nav-item ${isActive ? 'active' : ''} ${status === 'done' ? 'done' : ''} ${status === 'waiting' ? 'waiting' : ''}`}
                onClick={handleStepClick}
                style={{ cursor: 'pointer' }}
              >
                <div className="nav-item-icon-wrap">
                  <div className={`nav-dot ${status}`} />
                </div>
                <span className="nav-item-label">{s.short}</span>
                {status === 'done' && <CheckTiny />}
                {status === 'waiting' && <ActionTiny />}
                {isActive && <div className="nav-item-indicator" />}
              </div>
            );
          })}
        </div>
      </nav>


    </div>
  );
}

function ActionTiny() {
  return (
    <div className="ml-auto w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
  );
}

function CheckTiny() {
  return (
    <svg 
      width="10" height="10" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="4" 
      strokeLinecap="round" strokeLinejoin="round"
      className="text-green ml-auto"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
