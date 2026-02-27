"use client";

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function VelocityChart() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const res = await fetch('/api/historical');
                const json = await res.json();
                if (json.data) {
                    setData(json.data);
                }
            } catch (err) {
                console.error("Failed to load historic data", err);
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, []);

    if (loading) {
        return (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>Loading Historic Trajectory...</span>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ backgroundColor: '#1A1D24', border: '1px solid #374151', padding: '0.5rem 1rem', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <p style={{ color: '#9CA3AF', margin: '0 0 0.25rem 0', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{label}</p>
                    <p style={{ color: '#10B981', margin: 0, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        Index: {payload[0].value}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.5} />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'monospace' }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'monospace' }}
                        domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="velocity"
                        stroke="#10B981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorVelocity)"
                        isAnimationActive={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
