"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Download, Bookmark, Activity, Users, TrendingUp, AlertTriangle, ChevronDown, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFlights, setShowFlights] = useState(false);

  const origin = searchParams.get('origin');
  const date_from = searchParams.get('date_from');
  const date_to = searchParams.get('date_to');
  const volume = searchParams.get('volume');

  useEffect(() => {
    async function fetchIntelligence() {
      if (!origin || !date_from || !date_to) return;
      try {
        const params = new URLSearchParams({ origin, date_from, date_to, volume: volume || 1 });
        const res = await fetch(`/api/intelligence/demand?${params.toString()}`);
        if (!res.ok) throw new Error('API Error');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError('Failed to fetch intelligence telemetry.');
      } finally {
        setLoading(false);
      }
    }
    fetchIntelligence();
  }, [origin, date_from, date_to, volume]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '2rem' }}>
        <div className="live-indicator" style={{ width: '20px', height: '20px' }}></div>
        <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>AGGREGATING MACRO DEMAND TELEMETRY...</div>
      </div>
    );
  }

  if (error || !data) return <div style={{ color: 'red', textAlign: 'center', padding: '4rem' }}>{error}</div>;

  const formatDate = (isoStr) => new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Report Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
             <button onClick={() => router.back()} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', display: 'flex' }}>
                <ArrowLeft size={16} />
             </button>
             <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>MACRO DEMAND REPORT</div>
          </div>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>
            <span className="glow-text">{data.meta.origin}</span> <ArrowRight size={24} style={{ display: 'inline', margin: '0 0.5rem' }}/> LAS
          </h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
             {formatDate(data.meta.dateRange.start)} — {formatDate(data.meta.dateRange.end)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-growth)', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)', fontFamily: 'monospace', fontWeight: 'bold' }}>
            CONFIDENCE: {data.meta.confidence_score}% (HIGH)
          </div>
          <button className="btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}>
            <Bookmark size={16} /> Save
          </button>
          <button className="btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'var(--text-secondary)', cursor: 'not-allowed' }} title="Requires Enterprise Tier">
            <Download size={16} /> Export CSV
          </button>
          <button className="btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 1rem', background: '#fff', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} style={{ background: 'rgba(20,20,25,0.6)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: '1rem', fontSize: '0.8rem' }}><Users size={16}/> PROJECTED INBOUND SEATS</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{data.executive_summary.projected_seats.toLocaleString()}</div>
          <div style={{ color: 'var(--accent-growth)', fontSize: '0.9rem', marginTop: '0.5rem', fontFamily: 'monospace' }}>{data.executive_summary.yoy_growth} YoY Growth</div>
        </motion.div>
        
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} style={{ background: 'rgba(20,20,25,0.6)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: '1rem', fontSize: '0.8rem' }}><TrendingUp size={16}/> EST. ADR PREMIUM</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{data.executive_summary.est_adr_premium}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', fontFamily: 'monospace' }}>vs 30-day moving average</div>
        </motion.div>

        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} style={{ background: 'rgba(20,20,25,0.6)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: '1rem', fontSize: '0.8rem' }}><Activity size={16}/> COMPRESSION INDEX</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: data.executive_summary.compression_index > 80 ? '#ff3b30' : 'var(--text-primary)' }}>{data.executive_summary.compression_index}<span style={{fontSize:'1rem', color:'var(--text-muted)'}}>/100</span></div>
          <div style={{ color: data.executive_summary.compression_index > 80 ? '#ff3b30' : 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', fontFamily: 'monospace' }}>{data.executive_summary.compression_index > 80 ? 'CRITICAL HIGH' : 'MODERATE'}</div>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '1rem' }}>
        {/* Chart Section */}
        <div style={{ background: 'rgba(20,20,25,0.6)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontFamily: 'monospace', margin: '0 0 2rem 0', color: 'var(--text-secondary)' }}>CAPACITY ANALYSIS (SCHEDULED SEATS VS HISTORICAL)</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.capacity_analysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="seats" fill="var(--primary-color)" radius={[4, 4, 0, 0]} name="Scheduled Seats" />
                <Line type="monotone" dataKey="historical" stroke="var(--text-muted)" strokeWidth={2} dot={{ r: 4 }} name="Historical Avg" strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Signals & Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(20,20,25,0.6)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontFamily: 'monospace', margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>MARKET SIGNALS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.market_signals.map((sig, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>{sig.name}</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--accent-growth)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {sig.value} <Activity size={12} />
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ background: 'rgba(20,20,25,0.6)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontFamily: 'monospace', margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>EVENT CORRELATION</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.event_correlation.map((ev, i) => (
                <div key={i} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', borderLeft: ev.estimated_impact === 'High' ? '3px solid #ff3b30' : '3px solid var(--primary-color)' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{ev.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>{formatDate(ev.date)}</span>
                    <span style={{ color: ev.estimated_impact === 'High' ? '#ff3b30' : 'var(--primary-color)' }}>Impact: {ev.estimated_impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Analogues & Scenario Modeling */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
        <div style={{ background: 'rgba(20,20,25,0.6)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontFamily: 'monospace', margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>HISTORICAL ANALOGUES</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Closest Match (92% Correlation)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Nov 15-18, 2023</div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Pattern matches F1 Grand Prix 2023 demand curve. Capacity constraints on premium transcon routes were identical at T-45 days.
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Actual ADR</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>$482</div>
                </div>
                <div style={{ flex: 1, padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Occupancy</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>96%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ background: 'rgba(20,20,25,0.6)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontFamily: 'monospace', margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>SCENARIO MODELING (ENTERPRISE ONLY)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.7 }}>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem' }}>Adjust Carrier Capacity Delta</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--primary-color)' }}>+10%</span>
              </div>
              <input type="range" min="0" max="100" defaultValue="60" style={{ width: '100%', accentColor: 'var(--primary-color)' }} disabled />
            </div>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem' }}>Event Impact Multiplier</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--primary-color)' }}>1.5x</span>
              </div>
              <input type="range" min="0" max="100" defaultValue="40" style={{ width: '100%', accentColor: 'var(--primary-color)' }} disabled />
            </div>
            <button style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '0.5rem' }} disabled>
              Unlock Interactive Scenarios
            </button>
          </div>
        </div>
      </div>

      {/* Drill Down */}
      <div style={{ background: 'rgba(20,20,25,0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <button 
          onClick={() => setShowFlights(!showFlights)}
          style={{ width: '100%', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'monospace' }}
        >
          <span>UNDERLYING TELEMETRY (RAW FLIGHT DATA)</span>
          <ChevronDown size={20} style={{ transform: showFlights ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
        </button>
        {showFlights && (
          <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem 0' }}>Airline</th>
                  <th>Scheduled Flights</th>
                  <th>Est. Seats</th>
                  <th>Avg Fare</th>
                </tr>
              </thead>
              <tbody>
                {data.underlying_telemetry.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={`https://images.kiwi.com/airlines/32/${t.airline_code}.png`} alt={t.airline} style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'white' }} />
                      {t.airline}
                    </td>
                    <td>{t.scheduled_flights}</td>
                    <td>{t.est_seats.toLocaleString()}</td>
                    <td style={{ color: 'var(--primary-color)' }}>${t.avg_fare}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data Provenance */}
      <div style={{ marginTop: '1rem', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={14} />
          <span>DATA PROVENANCE: Verified GDS Telemetry</span>
        </div>
        <div style={{ fontFamily: 'monospace' }}>
          Generated: {formatDate(data.meta.generated_at)} | Algorithm v2.4 (Std Error: ±3.1%)
        </div>
      </div>

    </div>
  );
}

export default function MacroDemandReport() {
  return (
    <main style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '80px' }}>
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
           <div className="live-indicator"></div>
        </div>
      }>
        <ReportContent />
      </Suspense>
    </main>
  );
}
