import React from 'react';
import { Sparkles } from 'lucide-react';

export default function MetricBanner() {
  return (
    <div className="niq-metric-banner">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0052FF', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Sparkles size={12} /> NIQ Autonomous Impact
        </span>
      </div>

      <div className="niq-metric-card">
        <div className="niq-metric-pill">85%</div>
        <div className="niq-metric-text">
          Fewer manual IT reports thanks to AI automation
        </div>
      </div>

      <div className="niq-metric-card">
        <div className="niq-metric-pill">122T</div>
        <div className="niq-metric-text">
          Telemetry data points powering NIQ IT Reasoning Engine
        </div>
      </div>

      <div className="niq-metric-card">
        <div className="niq-metric-pill">7-15x</div>
        <div className="niq-metric-text">
          Faster closed-loop verification compared to traditional ticketing
        </div>
      </div>
    </div>
  );
}
