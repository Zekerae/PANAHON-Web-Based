import React, { useState, useEffect } from 'react';

// Standard 3x3 D6 Pip positions (0 to 8 cell indices)
const PIP_CONFIGS = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

export default function Dice({
  value,
  isRolling = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  onClick,
  disabled = false,
  theme = 'chrono', // 'chrono' | 'hazard' | 'success'
  isInteractive = true,
  showLabel = false
}) {
  const [displayVal, setDisplayVal] = useState(value || 1);
  const [landed, setLanded] = useState(false);

  // High-speed tumbling & cycling through faces while rolling
  useEffect(() => {
    if (isRolling) {
      setLanded(false);
      const interval = setInterval(() => {
        setDisplayVal(Math.floor(Math.random() * 6) + 1);
      }, 65);
      return () => clearInterval(interval);
    } else if (value !== null && value !== undefined && value >= 1 && value <= 6) {
      setDisplayVal(value);
      setLanded(true);
      const timer = setTimeout(() => setLanded(false), 650);
      return () => clearTimeout(timer);
    }
  }, [isRolling, value]);

  const pips = PIP_CONFIGS[displayVal] || PIP_CONFIGS[1];
  const isQuestion = !isRolling && (value === null || value === undefined);

  return (
    <div
      className={`chrono-dice-container size-${size} ${isRolling ? 'is-rolling' : ''} ${landed ? 'is-landed' : ''} theme-${theme} ${disabled ? 'is-disabled' : ''} ${isInteractive && !disabled && !isRolling ? 'can-interact' : ''}`}
      onClick={!disabled && !isRolling && onClick ? onClick : undefined}
      title={disabled ? undefined : (isInteractive ? 'Click or Press Spacebar to Roll Die' : undefined)}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isRolling && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="chrono-dice-cube">
        <div className="chrono-dice-face">
          {isQuestion ? (
            <div className="chrono-dice-unknown">?</div>
          ) : (
            <div className="chrono-dice-grid">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cellIdx) => (
                <div key={cellIdx} className="chrono-dice-pip-cell">
                  {pips.includes(cellIdx) && <div className="chrono-dice-pip" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showLabel && (
        <span className="chrono-dice-keyhint">SPACE</span>
      )}
    </div>
  );
}
