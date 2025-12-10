'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { Move, CompiledGame, Color } from '@/types';

// AI 모듈 임포트
import { createAI, type ChessAI, type AIType, type AILevel } from 'chesslang/ai';

export interface AIConfig {
  enabled: boolean;
  type: AIType;
  level: AILevel;
  color: Color;
}

interface AIHook {
  config: AIConfig;
  isThinking: boolean;
  setEnabled: (enabled: boolean) => void;
  setType: (type: AIType) => void;
  setLevel: (level: AILevel) => void;
  setColor: (color: Color) => void;
  getAIMove: (legalMoves: Move[], compiledGame: CompiledGame) => Promise<Move | null>;
}

export function useAI(): AIHook {
  const [config, setConfig] = useState<AIConfig>({
    enabled: false,
    type: 'minimax',
    level: 2,
    color: 'Black',
  });
  
  const [isThinking, setIsThinking] = useState(false);
  const aiRef = useRef<ChessAI | null>(null);
  
  const gameState = useGameStore((s) => s.gameState);
  
  // AI 인스턴스 생성/업데이트
  useEffect(() => {
    if (config.enabled) {
      aiRef.current = createAI(config.type, config.level);
    } else {
      aiRef.current = null;
    }
  }, [config.enabled, config.type, config.level]);
  
  const setEnabled = useCallback((enabled: boolean) => {
    setConfig(prev => ({ ...prev, enabled }));
  }, []);
  
  const setType = useCallback((type: AIType) => {
    setConfig(prev => ({ ...prev, type }));
  }, []);
  
  const setLevel = useCallback((level: AILevel) => {
    setConfig(prev => ({ ...prev, level }));
  }, []);
  
  const setColor = useCallback((color: Color) => {
    setConfig(prev => ({ ...prev, color }));
  }, []);
  
  const getAIMove = useCallback(async (
    legalMoves: Move[],
    compiledGame: CompiledGame
  ): Promise<Move | null> => {
    if (!aiRef.current || !gameState || legalMoves.length === 0) {
      return null;
    }
    
    setIsThinking(true);
    
    try {
      const move = await aiRef.current.selectMove(
        gameState,
        legalMoves,
        compiledGame
      );
      return move;
    } catch (error) {
      console.error('AI error:', error);
      return null;
    } finally {
      setIsThinking(false);
    }
  }, [gameState]);
  
  return {
    config,
    isThinking,
    setEnabled,
    setType,
    setLevel,
    setColor,
    getAIMove,
  };
}
