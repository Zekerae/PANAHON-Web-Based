import { useState, useEffect, useCallback } from 'react';
import sounds from '../sound.js';
import { ROLES } from '../gameData.js';

export function useNetworkRoom({ network, engine, showToast, onGameStartSuccess }) {
  const [currentRoomPlayers, setCurrentRoomPlayers] = useState([]);
  const [isConnectingOnline, setIsConnectingOnline] = useState(false);
  const [onlinePlayerName, setOnlinePlayerName] = useState('Temporal Castaway');
  const [onlineSelectedRole, setOnlineSelectedRole] = useState('HISTORIAN');
  const [onlineRoomCodeInput, setOnlineRoomCodeInput] = useState('');

  useEffect(() => {
    if (!network) return;

    network.onRoomCreated = (code) => {
      setIsConnectingOnline(false);
      setCurrentRoomPlayers(network.players ? network.players.slice() : []);
      showToast('Room Created', `Room Code: ${code}. Share with allies!`, 'success');
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
    };

    network.onError = (msg) => {
      setIsConnectingOnline(false);
      showToast('Multiplayer Alert', msg, 'danger');
    };

    return () => {
      network.onRoomCreated = null;
      network.onRoomJoined = null;
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

    const name = onlinePlayerName.trim() || 'Castaway';

    if (subMode === 'create') {
      showToast('Creating Mission', 'Connecting to Cloud Relay...', 'info');
      network.createRoom(name, onlineSelectedRole)
        .catch(() => setIsConnectingOnline(false));
    } else {
      const code = onlineRoomCodeInput.trim().toUpperCase();
      if (!code) {
        setIsConnectingOnline(false);
        showToast('Invalid Code', 'Please enter a 5-letter Room Code.', 'warning');
        return;
      }
      showToast('Connecting', `Connecting to Room ${code}...`, 'info');
      network.joinRoom(code, name, onlineSelectedRole)
        .catch(() => setIsConnectingOnline(false));
    }
  }, [network, isConnectingOnline, onlinePlayerName, onlineSelectedRole, onlineRoomCodeInput, showToast]);

  const leaveRoom = useCallback(() => {
    sounds.btnClick();
    network?.leaveRoom();
    setCurrentRoomPlayers([]);
  }, [network]);

  const startOnlineGame = useCallback(() => {
    sounds.btnClick();
    network?.startGame();
  }, [network]);

  return {
    currentRoomPlayers,
    isConnectingOnline,
    onlinePlayerName,
    setOnlinePlayerName,
    onlineSelectedRole,
    setOnlineSelectedRole,
    onlineRoomCodeInput,
    setOnlineRoomCodeInput,
    connectOnline,
    leaveRoom,
    startOnlineGame
  };
}
