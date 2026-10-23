import React, { useState } from 'react';
import sounds from '../sound.js';

export default function GuideModal({ onClose }) {
  const [guideTab, setGuideTab] = useState('overview');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        sounds.btnClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleTab = (tab) => {
    sounds.btnClick();
    setGuideTab(tab);
  };

  const handleClose = () => {
    sounds.btnClick();
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1500 }} onClick={handleOverlayClick}>
      <div className="modal" style={{ maxWidth: '680px', width: '95%' }}>
        <button className="modal-close" onClick={handleClose}>&times;</button>
        <div className="modal-title">PANAHON FIELD MANUAL (V0.3)</div>

        <div className="tab-nav" style={{ marginBottom: 'var(--space-md)' }}>
          {['overview', 'roles', 'mechanics', 'scoring'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${guideTab === tab ? 'active' : ''}`}
              onClick={() => handleTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="modal-body" style={{ fontSize: '0.85rem', lineHeight: '1.6', maxHeight: '55vh', overflowY: 'auto' }}>
          {guideTab === 'overview' && (
            <div>
              <h4 style={{ color: 'var(--text-accent)' }}>About The Game</h4>
              <p>PANAHON: Chrono Shift is a cooperative and competitive tabletop time-travel game for 4 players. Players take the role of <strong>Temporal Castaways</strong> responsible for correcting disturbances across different timelines. Mysterious artifacts have been displaced from their original eras.</p>
              <h4 style={{ color: 'var(--text-accent)', marginTop: '12px' }}>The 4 Historical Timelines</h4>
              <ul>
                <li><strong>Spanish Era (1521-1898):</strong> Silver Dos Mundos, Murillo Velarde Map, Concepcion Porcelain, Relicario.</li>
                <li><strong>American Era (1898-1946):</strong> Quezon Typewriter, El Renacimiento Issue, Kellogg Magneto, Port Telephone.</li>
                <li><strong>Japanese Era (1942-1945):</strong> Death March Marker, Senninbari Belt, Guerrilla Transceiver, Capas Field Litter.</li>
                <li><strong>Myth/Legend Era:</strong> Cordillera Bulul, Batu-Balani Agimat, Kamagong Comb, Kris ng Datu.</li>
              </ul>
            </div>
          )}

          {guideTab === 'roles' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ borderLeft: '3px solid #E74C3C', paddingLeft: '8px' }}>
                <strong>The Historian:</strong>
                <div><em>Passive (Decoy Discard):</em> Discard a drawn Decoy Card (2 Turn CD).</div>
                <div><em>Active (Clue Decipher):</em> Look at the top 3 cards on the Clue Deck, keep 1, shuffle rest (Cost: 2 Energy, 3 Turn CD).</div>
              </div>
              <div style={{ borderLeft: '3px solid #3498DB', paddingLeft: '8px' }}>
                <strong>The Explorer:</strong>
                <div><em>Passive (Chrono-Stride):</em> Reduced Time Gate travel cost to 1 Energy.</div>
                <div><em>Active (Momentum):</em> Pause movement to interact with a tile, then continue moving (Cost: 1 Energy, 2 Turn CD).</div>
              </div>
              <div style={{ borderLeft: '3px solid #2ECC71', paddingLeft: '8px' }}>
                <strong>The Guardian:</strong>
                <div><em>Passive (Aegis Shield):</em> Reduce any Hazard/Danger Card penalty by 1.</div>
                <div><em>Active (Temporal Repair):</em> Reduce Paradox Meter by 1 and either spend 2 Energy or restore 1 Energy (3 Turn CD).</div>
              </div>
              <div style={{ borderLeft: '3px solid #F39C12', paddingLeft: '8px' }}>
                <strong>The Strategist:</strong>
                <div><em>Passive (Trap Mastery):</em> +1 Energy when someone triggers your Trap.</div>
                <div><em>Active (Temporal Trap):</em> Plant a Danger Trap on your current tile (Cost: 2 Energy, 2 Turn CD).</div>
              </div>
            </div>
          )}

          {guideTab === 'mechanics' && (
            <div>
              <h4 style={{ color: 'var(--text-accent)' }}>Energy System (0 - 10)</h4>
              <p>Every player starts with 10 Energy. Moving through Time Gates costs 2 Energy (1 for Explorer). Reaching 0 Energy makes a player <strong>Stranded</strong>. A stranded player can spend their turn <strong>Resting</strong> to recover +3 Energy.</p>

              <h4 style={{ color: 'var(--text-accent)', marginTop: '10px' }}>Individual Paradox Meter (0 - 5)</h4>
              <ul>
                <li><strong>Level 0-1:</strong> Stable (+2 bonus points at game end).</li>
                <li><strong>Level 2:</strong> Minor Friction (-1 Point penalty).</li>
                <li><strong>Level 3:</strong> Temporal Strain (Immediate loss of 1 Energy).</li>
                <li><strong>Level 4:</strong> Anomaly Trigger (Immediately draw a Danger Card).</li>
                <li><strong>Level 5 (Critical Breach):</strong> +2 to Shared Timeline Meter, -3 Points, and meter resets to Level 2.</li>
              </ul>

              <h4 style={{ color: 'var(--text-danger)', marginTop: '10px' }}>Shared Timeline Meter (0 - 5)</h4>
              <p><strong>Losing Condition:</strong> The timeline meter max is 5. Once the breach goes above 5 (reaches 6), the timelines become completely messed up and <strong>all players immediately lose!</strong></p>

              <h4 style={{ color: 'var(--text-accent)', marginTop: '10px' }}>Artifact Acquisition Rule</h4>
              <p>Players must gather at least <strong>3 Clues</strong> related to a specific artifact before attempting to acquire it from an Artifact Tile.</p>
            </div>
          )}

          {guideTab === 'scoring' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                  <th style={{ padding: '6px' }}>Achievement</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Points</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ padding: '4px' }}>Complete Assigned Mission</td><td style={{ textAlign: 'right', color: 'var(--text-accent)', fontWeight: 700 }}>+10</td></tr>
                <tr><td style={{ padding: '4px' }}>Return Artifact to Correct Timeline</td><td style={{ textAlign: 'right', color: 'var(--text-accent)', fontWeight: 700 }}>+5</td></tr>
                <tr><td style={{ padding: '4px' }}>Complete Optional Objective</td><td style={{ textAlign: 'right', color: 'var(--text-accent)' }}>+2</td></tr>
                <tr><td style={{ padding: '4px' }}>Collect Required Clues</td><td style={{ textAlign: 'right', color: 'var(--text-accent)' }}>+1 each</td></tr>
                <tr><td style={{ padding: '4px' }}>Unused Energy Remaining</td><td style={{ textAlign: 'right', color: 'var(--text-accent)' }}>+1 each</td></tr>
                <tr><td style={{ padding: '4px' }}>Paradox Level 0-1 (Stewardship)</td><td style={{ textAlign: 'right', color: 'var(--text-success)' }}>+2</td></tr>
                <tr><td style={{ padding: '4px' }}>Paradox Level 4-5</td><td style={{ textAlign: 'right', color: 'var(--text-danger)' }}>-3</td></tr>
                <tr><td style={{ padding: '4px' }}>Mission Failure</td><td style={{ textAlign: 'right', color: 'var(--text-danger)' }}>-5</td></tr>
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleClose}>Understood</button>
        </div>
      </div>
    </div>
  );
}
