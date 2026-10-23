import { useState, useEffect, useCallback } from 'react';
import sounds from '../sound.js';

export function useChat(network) {
  const [chatMessages, setChatMessages] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    if (!network) return;

    // Preserve existing messages
    setChatMessages(network.chatMessages ? [...network.chatMessages] : []);

    const prevOnChatMessage = network.onChatMessage;
    network.onChatMessage = (chatMsg) => {
      sounds.chatChirp();
      if (network.chatMessages) {
        setChatMessages([...network.chatMessages]);
      } else {
        setChatMessages((prev) => [...prev, chatMsg]);
      }
      setUnreadChatCount((prev) => prev + 1);
      if (typeof prevOnChatMessage === 'function') {
        prevOnChatMessage(chatMsg);
      }
    };

    return () => {
      network.onChatMessage = prevOnChatMessage;
    };
  }, [network]);

  const resetUnread = useCallback(() => {
    setUnreadChatCount(0);
  }, []);

  const sendMessage = useCallback((text) => {
    if (!network || !text?.trim()) return;
    network.sendChatMessage(text.trim());
  }, [network]);

  const clearChat = useCallback(() => {
    setChatMessages([]);
    setUnreadChatCount(0);
  }, []);

  return {
    chatMessages,
    unreadChatCount,
    sendMessage,
    resetUnread,
    clearChat
  };
}
