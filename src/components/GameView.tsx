/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/Engine';
import { ShipType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { SHIP_CONFIGS } from '../types';
import { Shield, Zap, Target, Trophy, Play, Settings, RefreshCcw } from 'lucide-react';

const ShipSelectorItem: React.FC<{
  type: ShipType;
  isSelected: boolean;
  onSelect: (type: ShipType) => void;
  accentColor: string;
}> = ({ type, isSelected, onSelect, accentColor }) => {
  const config = SHIP_CONFIGS[type];
  return (
    <button
      onClick={() => onSelect(type)}
      className={`w-full p-4 border text-left transition-all ${
        isSelected 
          ? `border-[${accentColor}] bg-[${accentColor}]/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]` 
          : 'border-zinc-900 hover:border-zinc-800 bg-zinc-950/50'
      }`}
      style={{ borderColor: isSelected ? accentColor : undefined }}
    >
      <div className="flex justify-between items-center mb-1">
        <span className={`font-mono text-sm font-bold ${isSelected ? 'text-white' : 'text-zinc-600'}`}>
          {config.name}
        </span>
      </div>
      <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">{config.description}</p>
      {isSelected && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[8px] uppercase tracking-tighter text-zinc-600 font-bold">속도</span>
            <div className="h-1 bg-zinc-900"><div className="h-full" style={{ width: `${(config.speed / 500) * 100}%`, backgroundColor: accentColor }} /></div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[8px] uppercase tracking-tighter text-zinc-600 font-bold">화력</span>
            <div className="h-1 bg-zinc-900"><div className="h-full" style={{ width: `${(0.5 / config.fireRate) * 100}%`, backgroundColor: accentColor }} /></div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[8px] uppercase tracking-tighter text-zinc-600 font-bold">체력</span>
            <div className="h-1 bg-zinc-900"><div className="h-full" style={{ width: `${(config.health / 250) * 100}%`, backgroundColor: accentColor }} /></div>
          </div>
        </div>
      )}
    </button>
  );
};

const GameView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [isTwoPlayer, setIsTwoPlayer] = useState(false);
  const [selectedShip, setSelectedShip] = useState<ShipType>(ShipType.VANGUARD);
  const [selectedShipP2, setSelectedShipP2] = useState<ShipType>(ShipType.STEER);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [kills, setKills] = useState(0);
  
  // Player Stats
  const [p1Stats, setP1Stats] = useState({ health: 100, maxHealth: 100, power: 1, speed: 0 });
  const [p2Stats, setP2Stats] = useState({ health: 100, maxHealth: 100, power: 1, speed: 0 });

  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('space_guardian_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    if (gameState === 'gameOver' && score > highScore) {
      setHighScore(score);
      localStorage.setItem('space_guardian_highscore', score.toString());
    }
  }, [gameState, score, highScore]);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new GameEngine(canvasRef.current);
    }

    let lastTime = 0;
    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (engineRef.current && gameState === 'playing') {
        engineRef.current.update(Math.min(dt, 0.1));
        engineRef.current.draw();
        
        // Sync stats to React state
        setScore(engineRef.current.score);
        setKills(engineRef.current.kills);
        setLevel(engineRef.current.level);
        
        if (engineRef.current.player) {
          setP1Stats({
            health: engineRef.current.player.health,
            maxHealth: engineRef.current.player.maxHealth,
            power: engineRef.current.player.powerLevel,
            speed: engineRef.current.player.speedLevel
          });
        }
        
        if (engineRef.current.player2) {
          setP2Stats({
            health: engineRef.current.player2.health,
            maxHealth: engineRef.current.player2.maxHealth,
            power: engineRef.current.player2.powerLevel,
            speed: engineRef.current.player2.speedLevel
          });
        }

        if (engineRef.current.isGameOver) {
          setGameState('gameOver');
        }
      }
      requestAnimationFrame(loop);
    };

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    requestAnimationFrame(loop);

    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  const startGame = () => {
    if (engineRef.current) {
      engineRef.current.start(selectedShip, isTwoPlayer ? selectedShipP2 : null);
      setGameState('playing');
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#050505] text-[#F0F0F0] font-sans selection:bg-cyan-500 selection:text-black overflow-hidden flex flex-col border-8 border-zinc-900">
      <canvas ref={canvasRef} className="absolute inset-0 cursor-crosshair" />

      {/* HUD - Sophisticated Dark HUD */}
      <AnimatePresence>
        {gameState === 'playing' && (
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 w-full px-8 py-6 flex justify-between items-center pointer-events-none z-10 bg-gradient-to-b from-cyan-950/20 to-transparent border-b border-cyan-900/10"
          >
            {/* Player 1 Stats */}
            <div className="flex flex-col w-48">
              <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-500 font-bold">P1: {SHIP_CONFIGS[selectedShip].name}</span>
              <div className="h-1.5 w-full bg-zinc-900 mt-1 overflow-hidden">
                <motion.div className="h-full bg-cyan-500 shadow-[0_0_8px_cyan]" animate={{ width: `${(p1Stats.health / p1Stats.maxHealth) * 100}%` }} />
              </div>
            </div>

            <div className="flex gap-12">
              <div className="text-center">
                <span className="block text-[10px] uppercase tracking-widest text-cyan-600">합계 점수</span>
                <span className="text-3xl font-mono tabular-nums text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{score.toLocaleString()}</span>
              </div>
              <div className="hidden md:block text-center border-l border-zinc-900 pl-12">
                <span className="block text-[10px] uppercase tracking-widest text-cyan-600">레벨</span>
                <span className="text-3xl font-mono text-cyan-400">{level.toString().padStart(2, '0')}</span>
              </div>
            </div>

            {/* Player 2 Stats (if active) */}
            <div className="flex flex-col w-48 items-end text-right">
              {isTwoPlayer ? (
                <>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-pink-500 font-bold">P2: {SHIP_CONFIGS[selectedShipP2].name}</span>
                  <div className="h-1.5 w-full bg-zinc-900 mt-1 overflow-hidden">
                    <motion.div className="h-full bg-pink-500 shadow-[0_0_8px_pink]" animate={{ width: `${(p2Stats.health / p2Stats.maxHealth) * 100}%` }} />
                  </div>
                </>
              ) : (
                <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-700 font-bold">솔로 작전 중</span>
              )}
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Sidebar Upgrades */}
      <AnimatePresence>
        {gameState === 'playing' && (
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-10 pointer-events-none"
          >
            {/* P1 Upgrades */}
            <div className={`p-4 backdrop-blur-md border border-cyan-900/20 rounded-lg w-40 transition-opacity ${p1Stats.health <= 0 ? 'opacity-30' : 'opacity-100'}`}>
              <div className="text-[9px] uppercase tracking-widest text-cyan-500 mb-3 font-bold">P1 업그레이드</div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded border flex items-center justify-center font-bold text-xs ${p1Stats.power > 1 ? 'border-cyan-500 text-cyan-400 bg-cyan-950/30' : 'border-zinc-800 text-zinc-700'}`}>P</div>
                  <div className="flex-1">
                    <div className="h-1 bg-zinc-800"><div className="h-full bg-cyan-400" style={{ width: `${(p1Stats.power / 3) * 100}%` }}></div></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded border flex items-center justify-center font-bold text-xs ${p1Stats.speed > 0 ? 'border-cyan-500 text-cyan-400 bg-cyan-950/30' : 'border-zinc-800 text-zinc-700'}`}>S</div>
                  <div className="flex-1">
                    <div className="h-1 bg-zinc-800"><div className="h-full bg-cyan-400" style={{ width: `${(p1Stats.speed / 5) * 100}%` }}></div></div>
                  </div>
                </div>
              </div>
            </div>

            {/* P2 Upgrades */}
            {isTwoPlayer && (
              <div className={`p-4 backdrop-blur-md border border-pink-900/20 rounded-lg w-40 transition-opacity ${p2Stats.health <= 0 ? 'opacity-30' : 'opacity-100'}`}>
                <div className="text-[9px] uppercase tracking-widest text-pink-500 mb-3 font-bold">P2 업그레이드</div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded border flex items-center justify-center font-bold text-xs ${p2Stats.power > 1 ? 'border-pink-500 text-pink-400 bg-pink-950/30' : 'border-zinc-800 text-zinc-700'}`}>P</div>
                    <div className="flex-1">
                      <div className="h-1 bg-zinc-800"><div className="h-full bg-pink-400" style={{ width: `${(p2Stats.power / 3) * 100}%` }}></div></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded border flex items-center justify-center font-bold text-xs ${p2Stats.speed > 0 ? 'border-pink-500 text-pink-400 bg-pink-950/30' : 'border-zinc-800 text-zinc-700'}`}>S</div>
                    <div className="flex-1">
                      <div className="h-1 bg-zinc-800"><div className="h-full bg-pink-400" style={{ width: `${(p2Stats.speed / 5) * 100}%` }}></div></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Footer Controls */}
      <AnimatePresence>
        {gameState === 'playing' && (
          <motion.footer 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 w-full px-8 py-4 bg-zinc-950/80 border-t border-zinc-900 flex justify-between items-center z-10 pointer-events-none"
          >
            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[10px] rounded border border-zinc-700">WASD / 방향키</kbd>
                <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold">P1 이동</span>
              </div>
              {isTwoPlayer && (
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[10px] rounded border border-zinc-700">방향키</kbd>
                  <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold">P2 이동</span>
                </div>
              )}
            </div>
            <div className="text-[10px] font-mono text-zinc-600 tracking-widest italic">
              {isTwoPlayer ? '듀얼_전투_링크_활성화' : '솔로_정찰_모드'}
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* Ambient Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-cyan-500/5 via-transparent to-pink-500/5 z-[1]"></div>
      <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 z-[1]"></div>

      {/* Menus */}
      <AnimatePresence mode="wait">
        {gameState === 'menu' && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 flex items-center justify-center p-4 z-20"
          >
            <div className="max-w-6xl w-full backdrop-blur-xl bg-[#050505]/80 border border-cyan-900/20 p-8 md:p-12 shadow-[0_0_50px_rgba(34,211,238,0.1)]">
              <div className="flex flex-col gap-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <h1 className="text-5xl md:text-7xl font-black font-mono tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-700 drop-shadow-2xl">
                      SPACE GUARDIAN
                    </h1>
                    <p className="text-cyan-500/60 text-sm uppercase tracking-[0.3em] font-bold mt-2">디럭스 에디션</p>
                  </div>
                  
                  <div className="flex gap-4 mt-6 md:mt-0">
                    <button 
                      onClick={() => setIsTwoPlayer(false)}
                      className={`px-6 py-3 font-bold uppercase tracking-widest text-xs transition-all border ${!isTwoPlayer ? 'bg-cyan-600 text-black border-cyan-600' : 'border-zinc-800 text-zinc-500'}`}
                    >
                      1인 플레이
                    </button>
                    <button 
                      onClick={() => setIsTwoPlayer(true)}
                      className={`px-6 py-3 font-bold uppercase tracking-widest text-xs transition-all border ${isTwoPlayer ? 'bg-pink-600 text-black border-pink-600' : 'border-zinc-800 text-zinc-500'}`}
                    >
                      2인 플레이
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Player 1 Selection */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500" />
                      <h2 className="text-xs font-black uppercase tracking-widest text-cyan-500">플레이어 1 기체 선별</h2>
                    </div>
                    <div className="space-y-3">
                      {(Object.keys(SHIP_CONFIGS) as ShipType[]).map((type) => (
                        <ShipSelectorItem 
                          key={type} 
                          type={type} 
                          isSelected={selectedShip === type} 
                          onSelect={setSelectedShip} 
                          accentColor="#06b6d4"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Player 2 Selection / Info */}
                  <div className="space-y-6">
                    {isTwoPlayer ? (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-2 h-2 rounded-full bg-pink-500" />
                          <h2 className="text-xs font-black uppercase tracking-widest text-pink-500">플레이어 2 기체 선별</h2>
                        </div>
                        <div className="space-y-3">
                          {(Object.keys(SHIP_CONFIGS) as ShipType[]).map((type) => (
                            <ShipSelectorItem 
                              key={type} 
                              type={type} 
                              isSelected={selectedShipP2 === type} 
                              onSelect={setSelectedShipP2} 
                              accentColor="#ec4899"
                            />
                          ))}
                        </div>
                      </>
                    ) : (highScore > 0 && (
                      <div className="p-8 border border-cyan-500/10 bg-cyan-500/5 h-full flex flex-col justify-center items-center text-center">
                        <Trophy size={48} className="text-cyan-500/30 mb-4" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 mb-2">전설의 전당</span>
                        <span className="font-mono text-4xl font-black text-cyan-400 mb-1">{highScore.toLocaleString()}</span>
                        <p className="text-[10px] text-cyan-900 font-bold uppercase tracking-widest">개인 최고 전투 기록</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 border-t border-zinc-900 pt-12">
                  <button 
                    onClick={startGame}
                    className="flex-1 h-20 bg-white text-black font-black uppercase tracking-[0.3em] text-xl flex items-center justify-center gap-4 hover:bg-cyan-400 transition-colors group"
                  >
                    <Play size={28} className="group-hover:scale-110 transition-transform" /> 미션 시작
                  </button>
                  <button className="px-12 h-20 border border-zinc-800 font-bold uppercase tracking-[0.2em] text-xs text-zinc-500 hover:text-white hover:border-zinc-500 transition-all">
                    리더보드
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'gameOver' && (
          <motion.div 
            key="gameOver"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-4 bg-black/80 z-30 pointer-events-auto"
          >
            <div className="max-w-md w-full border border-pink-900/50 p-8 bg-[#050505]">
              <h2 className="text-4xl font-black font-mono tracking-tighter text-pink-500 mb-2 uppercase drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">선체 파괴됨</h2>
              <p className="text-zinc-600 text-xs font-medium uppercase tracking-[0.2em] mb-12">미션 리포트 분석</p>
              
              <div className="grid grid-cols-2 gap-8 mb-12">
                <div>
                  <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">최종 점수</p>
                  <p className="text-3xl font-mono font-black text-white">{score.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">적 처치 수</p>
                  <p className="text-3xl font-mono font-black text-white">{kills}</p>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={startGame}
                  className="w-full h-14 bg-white text-black font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-cyan-400 transition-colors"
                >
                  <RefreshCcw size={20} /> 새로운 선체 출격
                </button>
                <button 
                  onClick={() => setGameState('menu')}
                  className="w-full h-14 border border-zinc-900 text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs hover:text-white hover:border-zinc-700 transition-all"
                >
                  본부로 귀환
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;900&family=Orbitron:wght@400;700;900&display=swap');
        
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'Orbitron', sans-serif; }
        
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        .relative::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            rgba(18, 16, 16, 0) 50%,
            rgba(0, 0, 0, 0.1) 50%
          ), linear-gradient(
            90deg,
            rgba(255, 0, 0, 0.03),
            rgba(0, 255, 0, 0.01),
            rgba(0, 0, 255, 0.03)
          );
          background-size: 100% 4px, 3px 100%;
          pointer-events: none;
          z-index: 50;
        }
      `}</style>
    </div>
  );
};

export default GameView;
