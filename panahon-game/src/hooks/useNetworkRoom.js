import { useState, useEffect, useCallback } from 'react';
import sounds from '../sound.js';
import { ROLES } from '../gameData.js';
import { getSavedProfile } from '../sessionManager.js';

export function useNetworkRoom({ network, engine, showToast, onGameStartSuccess }) {
  const [currentRoomPlayers, setCurrentRoomPlayers] = useState([]);
  const [isConnectingOnline, setIsConnectingOnline] = useState(false);
  const [onlinePlayerName, setOnlinePlayerName] = useState(() => {
    return getSavedProfile().name;
  });
  const [onlineSelectedRole, setOnlineSelectedRole] = useState(() => {
    return getSavedProfile().roleKey;
  });
  const [onlineRoomCodeInput, setOnlineRoomCodeInput] = useState('');
  const [spectators, setSpectators] = useState([]);
  const [isSpectator, setIsSpectator] = useState(false);
  const [canSpectatePrompt, setCanSpectatePrompt] = useState(null);

  // Sync with profile changes from Profile tab or Local Lobby
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      const { name, roleKey } = e.detail || {};
      if (name) setOnlinePlayerName(name);
      if (roleKey) setOnlineSelectedRole(roleKey);
    };
    window.addEventListener('panahon_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('panahon_profile_updated', handleProfileUpdate);
  }, []);

  // If current room has other players and our selected role is already taken, switch to first available role
  useEffect(() => {
    if (currentRoomPlayers && currentRoomPlayers.length > 0) {
      const otherPlayers = currentRoomPlayers.filter((p) => p.name !== onlinePlayerName);
      const otherRoles = new Set(otherPlayers.map((p) => p.roleKey));
      if (otherRoles.has(onlineSelectedRole)) {
        const available = ['HISTORIAN', 'EXPLORER', 'GUARDIAN', 'STRATEGIST'].find((rk) => !otherRoles.has(rk));
        if (available) {
          setOnlineSelectedRole(available);
        }
      }
    }
  }, [currentRoomPlayers, onlinePlayerName, onlineSelectedRole]);

  useEffect(() => {
    if (!network) return;

    network.onRoomCreated = (code) => {
      setIsConnectingOnline(false);
      setIsSpectator(false);
      setCurrentRoomPlayers(network.players ? network.players.slice() : []);
      setSpectators(network.spectators ? network.spectators.slice() : []);
      showToast('Room Created', `Room Code: ${code}. Share with allies!`, 'success');
    };

    network.onSpectatorJoined = (msg) => {
      setIsConnectingOnline(false);
      setIsSpectator(true);
      setCanSpectatePrompt(null);
      setCurrentRoomPlayers(msg.players || (network.players ? network.players.slice() : []));
      setSpectators(msg.spectators || (network.spectators ? network.spectators.slice() : []));
      showToast('Spectator Mode Active', `Observing timeline coordinates in Room ${msg.roomCode}.`, 'success');

      // If game has already started and we have state, enter game view immediately!
      if (msg.gameStarted && msg.state) {
        sounds.portal();
        sounds.startBgMusic();
        if (onGameStartSuccess) {
          onGameStartSuccess({ isSpectator: true });
        }
      }
    };

    network.onSpectatorCountUpdate = (specs, joined, left) => {
      setSpectators(specs || []);
      if (joined) {
        showToast('Observer Connected', `${joined.name} is now spectating this mission.`, 'info');
      } else if (left) {
        showToast('Observer Departed', `${left.name} stopped spectating.`, 'info');
      }
    };

    network.onCanSpectate = (promptData) => {
      setIsConnectingOnline(false);
      setCanSpectatePrompt(promptData);
      showToast('Match Notice', promptData.message, 'warning');
    };

    network.onRoomJoined = (code, players) => {
      setIsConnectingOnline(false);
      setCurrentRoomPlayers(players || (network.players ? network.players.slice() : []));
      showToast('Joined Room', `Connected to Room ${code}`, 'success');
    };

    network.onRosterUpdate = (players) => {
      setCurrentRoomPlayers(players || []);
    };

    network.onPlayerJoin = (player) => {
      setCurrentRoomPlayers((prev) => {
        if (!prev.some((p) => p.id === player.id || (p.name === player.name && p.roleKey === player.roleKey))) {
          return [...prev, player];
        }
        return prev;
      });
      const roleName = ROLES[player.roleKey]?.name || player.roleKey;
      showToast('Allied Castaway Arrived', `${player.name} joined as ${roleName}!`, 'info');
    };

    network.onPlayerLeave = (playerData) => {
      const leavingId = typeof playerData === 'number' ? playerData : playerData?.id;
      setCurrentRoomPlayers((prev) => prev.filter((p) => p.id !== leavingId));
      showToast('Castaway Departed', 'A player departed the timeline.', 'warning');
    };

    network.onRoomClosed = (msg) => {
      setIsConnectingOnline(false);
      setCurrentRoomPlayers([]);
      showToast('Anomaly Closed', msg || 'Room closed by host.', 'danger');
    };

    network.onGameStart = (players) => {
      sounds.portal();
      const configs = players.map((p) => ({
        name: p.name,
        roleKey: p.roleKey,
        isLocal: network.isHost ? p.id === 0 : p.id === network.playerId,
        connectionId: p.id
      }));
      engine.initGame(configs);
      sounds.startBgMusic();
      if (onGameStartSuccess) {
        onGameStartSuccess();
      }
      showToast('Chrono Shift Engaged', 'All timelines active. Protect the flow of history!', 'success');
    };

    network.onStateUpdate = (state) => {
      engine.loadState(state);
      if (network.isSpectator && onGameStartSuccess) {
        onGameStartSuccess({ isSpectator: true });
      }
    };

    network.onError = (msg) => {
      setIsConnectingOnline(false);
      showToast('Multiplayer Alert', msg, 'danger');
    };

    return () => {
      network.onRoomCreated = null;
      network.onRoomJoined = null;
      network.onSpectatorJoined = null;
      network.onSpectatorCountUpdate = null;
      network.onCanSpectate = null;
      network.onRosterUpdate = null;
      network.onPlayerJoin = null;
      network.onPlayerLeave = null;
      network.onRoomClosed = null;
      network.onGameStart = null;
      network.onStateUpdate = null;
      network.onError = null;
    };
  }, [network, engine, showToast, onGameStartSuccess]);

  const connectOnline = useCallback((subMode) => {
    if (isConnectingOnline || !network) return;
    setIsConnectingOnline(true);
    network.setMode('online');

    const prof = getSavedProfile();
    const rawName = (onlinePlayerName || '').trim();
    const name = (!rawName || rawName === 'Temporal Castaway' || rawName === 'Operative One') ? prof.name : rawName;
    const role = onlineSelectedRole || prof.roleKey || 'HISTORIAN';

    if (subMode === 'create') {
      showToast('Creating Mission', 'Connecting to Cloud Relay...', 'info');
      network.createRoom(name, role)
        .catch(() => setIsConnectingOnline(false));
    } else {
      const code = onlineRoomCodeInput.trim().toUpperCase();
      if (!code) {
        setIsConnectingOnline(false);
        showToast('Invalid Code', 'Please enter a 5-letter Room Code.', 'warning');
        return;
      }
      showToast('Connecting', `Connecting to Room ${code}...`, 'info');
      network.joinRoom(code, name, role)
        .catch(() => setIsConnectingOnline(false));
    }
  }, [network, isConnectingOnline, onlinePlayerName, onlineSelectedRole, onlineRoomCodeInput, showToast]);

  const spectateOnline = useCallback((codeToSpectate, customName) => {
    if (isConnectingOnline || !network) return;
    const code = (codeToSpectate || onlineRoomCodeInput).trim().toUpperCase();
    if (!code) {
      showToast('Invalid Code', 'Please enter a 5-letter Room Code to spectate.', 'warning');
      return;
    }
    const prof = getSavedProfile();
    const name = (customName || onlinePlayerName).trim() || prof.name || 'Chronos Observer';
    setIsConnectingOnline(true);
    network.setMode('online');
    showToast('Observatory Uplink', `Connecting to Room ${code} as Spectator...`, 'info');
    network.spectateRoom(code, name).catch((err) => {
      setIsConnectingOnline(false);
      showToast('Spectate Failed', err?.message || 'Failed to spectate room.', 'danger');
    });
  }, [network, isConnectingOnline, onlineRoomCodeInput, onlinePlayerName, showToast]);

  const acceptCanSpectate = useCallback(() => {
    if (!canSpectatePrompt) return;
    const code = canSpectatePrompt.roomCode;
    setCanSpectatePrompt(null);
    spectateOnline(code, onlinePlayerName);
  }, [canSpectatePrompt, spectateOnline, onlinePlayerName]);

  const dismissCanSpectatePrompt = useCallback(() => {
    setCanSpectatePrompt(null);
  }, []);

  const leaveRoom = useCallback(() => {
    sounds.btnClick();
    network?.leaveRoom();
    setCurrentRoomPlayers([]);
    setSpectators([]);
    setIsSpectator(false);
    setCanSpectatePrompt(null);
  }, [network]);

  const startOnlineGame = useCallback(() => {
    sounds.btnClick();
    network?.startGame();
  }, [network]);

  return {
    currentRoomPlayers,
    spectators,
    isSpectator,
    canSpectatePrompt,
    isConnectingOnline,
    onlinePlayerName,
    setOnlinePlayerName,
    onlineSelectedRole,
    setOnlineSelectedRole,
    onlineRoomCodeInput,
    setOnlineRoomCodeInput,
    connectOnline,
    spectateOnline,
    acceptCanSpectate,
    dismissCanSpectatePrompt,
    leaveRoom,
    startOnlineGame
  };
}
