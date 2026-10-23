import React from 'react';
import TitleScreen from './TitleScreen.jsx';
import LobbyScreen from './LobbyScreen.jsx';
import GameScreen from './GameScreen.jsx';
import EndGameScreen from './EndGameScreen.jsx';

export default function AppRouter({
  currentScreen,
  titleProps,
  lobbyProps,
  gameProps,
  endgameProps
}) {
  switch (currentScreen) {
    case 'title':
      return <TitleScreen {...titleProps} />;
    case 'lobby':
      return <LobbyScreen {...lobbyProps} />;
    case 'game':
      return gameProps.state ? <GameScreen {...gameProps} /> : null;
    case 'endgame':
      return endgameProps.state ? <EndGameScreen {...endgameProps} /> : null;
    default:
      return null;
  }
}
