"use client";

import React from 'react';
import { usePulse, STAKEHOLDERS } from './PulseContext';

export default function StakeholderToggle() {
  const { activeStakeholder, setActiveStakeholder } = usePulse();

  return (
    <div className="stakeholder-toggle glass-panel" style={{
      display: 'flex',
      gap: '0.5rem',
      padding: '0.5rem',
      overflowX: 'auto',
      marginBottom: '2rem',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      whiteSpace: 'nowrap',
      scrollbarWidth: 'none', // Firefox
      msOverflowStyle: 'none', // IE/Edge
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        .stakeholder-toggle::-webkit-scrollbar {
          display: none;
        }
        .stakeholder-btn {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .stakeholder-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }
        .stakeholder-btn.active {
          background: var(--bg-primary);
          border-color: var(--border-color);
          color: var(--text-primary);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
      `}} />
      {STAKEHOLDERS.map((s) => (
        <button
          key={s.id}
          className={`stakeholder-btn ${activeStakeholder === s.id ? 'active' : ''}`}
          onClick={() => setActiveStakeholder(s.id)}
        >
          <span>{s.icon}</span>
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  );
}
