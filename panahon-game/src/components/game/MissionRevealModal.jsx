import React, { useCallback, useEffect, useRef, useState } from 'react';
import sounds from '../../sound.js';
import { ERA_NAMES } from '../../gameData.js';

export default function MissionRevealModal({
  isOpen,
  player,
  targetRef,
  mobileTargetRef,
  sequencePosition = 1,
  sequenceTotal = 1,
  onArchiveStart,
  onArchived
}) {
  const cardRef = useRef(null);
  const overlayRef = useRef(null);
  const archiveButtonRef = useRef(null);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    setIsArchiving(false);
    if (isOpen) {
      window.requestAnimationFrame(() => archiveButtonRef.current?.focus());
    }
  }, [isOpen, player?.id]);

  const archiveMission = useCallback(() => {
    if (isArchiving || !cardRef.current) return;

    setIsArchiving(true);
    sounds.btnClick();
    onArchiveStart?.(player);

    const finish = () => {
      sounds.portal?.();
      onArchived?.();
    };

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || typeof cardRef.current.animate !== 'function') {
      window.setTimeout(finish, 120);
      return;
    }

    // Wait for the hand panel to become visible on compact layouts before
    // measuring the Mission Dossier tab as the animation destination.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const card = cardRef.current;
        const isCompactLayout = window.matchMedia?.('(max-width: 920px), (max-height: 550px)').matches;
        const preferredTarget = isCompactLayout ? mobileTargetRef?.current : targetRef?.current;
        const fallbackTarget = isCompactLayout ? targetRef?.current : mobileTargetRef?.current;
        const target = preferredTarget?.getBoundingClientRect().width ? preferredTarget : fallbackTarget;
        if (!card || !target) {
          finish();
          return;
        }

        const cardRect = card.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        if (!targetRect.width || !targetRect.height) {
          finish();
          return;
        }

        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        const destinationScale = Math.max(
          0.08,
          Math.min(0.24, targetRect.width / cardRect.width, targetRect.height / cardRect.height)
        );

        overlayRef.current?.animate(
          [{ opacity: 1 }, { opacity: 0.12 }],
          { duration: 700, easing: 'ease-in', fill: 'forwards' }
        );

        const animation = card.animate([
          {
            transform: 'translate3d(0, 0, 0) scale(1)',
            opacity: 1,
            filter: 'drop-shadow(0 20px 45px rgba(0, 0, 0, 0.72))'
          },
          {
            transform: `translate3d(${(targetCenterX - cardCenterX) * 0.58}px, ${(targetCenterY - cardCenterY) * 0.58}px, 0) scale(0.62)`,
            opacity: 0.92,
            filter: 'drop-shadow(0 0 24px rgba(255, 210, 77, 0.72))',
            offset: 0.62
          },
          {
            transform: `translate3d(${targetCenterX - cardCenterX}px, ${targetCenterY - cardCenterY}px, 0) scale(${destinationScale})`,
            opacity: 0.08,
            filter: 'drop-shadow(0 0 8px rgba(255, 210, 77, 0.35))'
          }
        ], {
          duration: 720,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards'
        });

        animation.finished.then(finish).catch(finish);
      });
    });
  }, [isArchiving, mobileTargetRef, onArchiveStart, onArchived, player, targetRef]);

  useEffect(() => {
    if (!isOpen || isArchiving) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        archiveButtonRef.current?.focus();
        return;
      }
      if (event.key === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        archiveMission();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isArchiving, archiveMission]);

  if (!isOpen || !player?.mission) return null;

  const mission = player.mission;
  const originEraName = ERA_NAMES[mission.originEra || mission.targetEra] || 'Origin Era';

  return (
    <div
      ref={overlayRef}
      className={`mission-reveal-overlay ${isArchiving ? 'is-archiving' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-reveal-title"
      aria-describedby="mission-reveal-description"
    >
      <div className="mission-reveal-vignette" aria-hidden="true" />
      <div className="mission-reveal-scanlines" aria-hidden="true" />

      <section ref={cardRef} className="mission-reveal-card">
        <header className="mission-reveal-header">
          <div className="mission-reveal-kicker">CLASSIFIED TEMPORAL ASSIGNMENT</div>
          <div className="mission-reveal-operative">
            <span>OPERATIVE</span>
            <strong style={{ color: player.color || '#FFE66D' }}>{player.name}</strong>
            {sequenceTotal > 1 && (
              <span className="mission-reveal-sequence">{sequencePosition}/{sequenceTotal}</span>
            )}
          </div>
        </header>

        <div className="mission-reveal-seal" aria-hidden="true">📜</div>
        <h2 id="mission-reveal-title" className="mission-reveal-title">
          RETRIEVE {mission.artifactNickname || mission.artifactName || 'THE LOST RELIC'}
        </h2>
        <p id="mission-reveal-description" className="mission-reveal-description">
          {mission.description}
        </p>

        <div className="mission-reveal-origin">
          <span className="mission-reveal-origin-label">HISTORICAL ORIGIN</span>
          <strong>🏛️ {originEraName}</strong>
          <span className="mission-reveal-classified">DISPLACED LOCATION: CLASSIFIED</span>
        </div>

        <div className="mission-reveal-directive">
          <span className="mission-reveal-directive-icon" aria-hidden="true">🔍</span>
          <div>
            <span className="mission-reveal-directive-label">YOUR FIRST DIRECTIVE</span>
            <strong>Secure the artifact clue</strong>
            <p>
              Land on a Clue Tile in <b>{originEraName}</b> to begin triangulating the relic's location.
            </p>
          </div>
        </div>

        <div className="mission-reveal-route" aria-label="Mission route overview">
          <span><b>1</b> Find clue</span>
          <i aria-hidden="true">→</i>
          <span><b>2</b> Scan gate</span>
          <i aria-hidden="true">→</i>
          <span><b>3</b> Recover relic</span>
          <i aria-hidden="true">→</i>
          <span><b>4</b> Return home</span>
        </div>

        <button
          ref={archiveButtonRef}
          type="button"
          className="mission-reveal-archive-btn"
          onClick={archiveMission}
          disabled={isArchiving}
        >
          {isArchiving ? 'ARCHIVING DOSSIER…' : 'ACKNOWLEDGE & ARCHIVE TO DOSSIER'}
          {!isArchiving && <span>ENTER / SPACE</span>}
        </button>
      </section>
    </div>
  );
}
