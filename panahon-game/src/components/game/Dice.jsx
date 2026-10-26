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
      const timer = setTimeout(() => setLanded(false), 550);
      return () => clearTimeout(timer);
    }
  }, [isRolling, value]);

  const pips = PIP_CONFIGS[displayVal] || PIP_CONFIGS[1];
  const isQuestion = !isRolling && (value === null || value === undefined);

  return (
    <div
      className={`pixel-dice-container chrono-dice-container size-${size} ${isRolling ? 'is-rolling' : ''} ${landed ? 'is-landed' : ''} theme-${theme} ${disabled ? 'is-disabled' : ''} ${isInteractive && !disabled && !isRolling ? 'can-interact' : ''}`}
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
      <div className="pixel-dice-shadow" />
      <div className="pixel-dice-cube chrono-dice-cube">
        {/* 2.5D Isometric Top Facet */}
        <div className="pixel-dice-top-facet">
          <div className="facet-pip-row">
            <span className="facet-pip" />
            <span className="facet-pip" />
          </div>
        </div>

        {/* 2.5D Isometric Right Facet */}
        <div className="pixel-dice-side-facet">
          <div className="facet-pip-col">
            <span className="facet-pip" />
            <span className="facet-pip" />
            <span className="facet-pip" />
          </div>
        </div>

        {/* 2.5D Front Face */}
        <div className="pixel-dice-front-face chrono-dice-face">
          {isQuestion ? (
            <div className="pixel-dice-unknown chrono-dice-unknown">?</div>
          ) : (
            <div className="pixel-dice-grid chrono-dice-grid">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cellIdx) => (
                <div key={cellIdx} className="pixel-dice-pip-cell chrono-dice-pip-cell">
                  {pips.includes(cellIdx) && (
                    <div className={`pixel-dice-pip chrono-dice-pip ${displayVal === 1 ? 'pip-ace' : ''}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showLabel && (
        <span className="pixel-dice-keyhint chrono-dice-keyhint">SPACE</span>
      )}
    </div>
  );
}
