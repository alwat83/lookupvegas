"use client";

import React, { createContext, useContext, useState } from 'react';

const PulseContext = createContext();

export const STAKEHOLDERS = [
  { id: 'all', label: 'Overview', icon: '🌆' },
  { id: 'casino', label: 'Casino Executive', icon: '🎰' },
  { id: 'hotel', label: 'Hotel Operator', icon: '🛎️' },
  { id: 'restaurant', label: 'Restaurant Owner', icon: '🍽️' },
  { id: 'driver', label: 'Ride Share Driver', icon: '🚗' },
  { id: 'str', label: 'STR Owner', icon: '🏠' },
  { id: 'worker', label: 'Local Worker', icon: '👷' },
];

export function PulseProvider({ children }) {
  const [activeStakeholder, setActiveStakeholder] = useState('all');

  return (
    <PulseContext.Provider value={{ activeStakeholder, setActiveStakeholder }}>
      {children}
    </PulseContext.Provider>
  );
}

export function usePulse() {
  return useContext(PulseContext);
}
