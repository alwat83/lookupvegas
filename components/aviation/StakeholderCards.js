"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function StakeholderCards() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/aviation/snapshot');
        if (!res.ok) throw new Error('Failed to fetch aviation data');
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || error || !data || !data.stakeholderInsights) return null;

  const insights = data.stakeholderInsights;

  const cards = [
    { id: 'casino', icon: '🎰', title: 'Casino & Gaming', text: insights.casino },
    { id: 'hospitality', icon: '🏨', title: 'Hotels & Hospitality', text: insights.hospitality },
    { id: 'transport', icon: '🚗', title: 'Ground Transportation', text: insights.transport },
    { id: 'retail', icon: '🛍️', title: 'Retail & Dining', text: insights.retail },
    { id: 'events', icon: '🎪', title: 'Events & Entertainment', text: insights.events },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
      {cards.map((card, i) => (
        card.text ? (
          <motion.div 
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02, borderColor: 'rgba(0, 242, 254, 0.4)' }}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '1.25rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{card.icon}</span>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{card.title}</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
              {card.text}
            </p>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
              📡 Based on live ADS-B data
            </div>
          </motion.div>
        ) : null
      ))}
    </div>
  );
}
