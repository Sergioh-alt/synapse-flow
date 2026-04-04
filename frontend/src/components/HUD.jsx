import React from 'react';
import { useEditMode } from '../contexts/EditModeContext';
import { DEFAULT_LAYOUT } from '../App';

const HUD = () => {
  const { 
    editMode, 
    toggleEditMode, 
    isMovementLocked, 
    setIsMovementLocked,
    isFunctionLocked,
    setIsFunctionLocked,
    totalTokens 
  } = useEditMode();

  // Acumulador de totalUSD basado en los tokens consumidos
  const totalUSD = (totalTokens * 0.00015).toFixed(4);

  return (
    <header className={`h-14 border border-neon-cyan/30 flex items-center px-6 shrink-0 rounded-xl relative overflow-hidden transition-all duration-300 ${editMode ? (isMovementLocked ? 'ring-1 ring-orange-500' : 'ring-2 ring-cyan-500') : ''}`}>
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50" />
      
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-neon-cyan/20 border border-neon-cyan flex items-center justify-center shadow-[0_0_10px_rgba(0,245,255,0.3)]">
          <span className="font-hud text-neon-cyan text-lg">⌬</span>
        </div>
        <div>
           <h1 className="text-sm font-hud font-bold tracking-[0.2em] text-glow-cyan text-neon-cyan">SYNAPSE FLOW (SF-2026)</h1>
           <p className="text-[10px] font-mono text-gray-500 uppercase">Cognitive Node Pipeline</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-[15px]">
        {/* Toggle Modo Edición */}
        <div className="flex items-center gap-2 bg-dark-900/50 border border-gray-600/30 rounded p-1 px-2">
          <span className={`text-[10px] font-mono tracking-widest pointer-events-none ${editMode ? 'text-amber-500 text-glow-amber' : 'text-gray-500'}`}>Modo Edición</span>
          <button 
            onClick={() => {
               if(toggleEditMode) toggleEditMode(); 
            }}
            className={`relative w-9 h-4 rounded-full transition-colors border ${editMode ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-dark-900 border-gray-600'}`}
          >
            <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-transform ${editMode ? 'translate-x-5 bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'translate-x-1 bg-gray-500'}`} />
          </button>
        </div>

        {editMode && (
          <div className="flex gap-[15px] items-center">
            <button
              onClick={() => setIsMovementLocked(!isMovementLocked)}
              title="Toggle Layout Dragging & Sizing"
              className={`px-3 py-1 rounded border text-[10px] font-mono transition-colors ${isMovementLocked ? 'bg-orange-900/30 border-orange-500/50 text-orange-400 hover:bg-orange-900/50' : 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/50'}`}
            >
              M: {isMovementLocked ? '🔒 L' : '🔓 U'}
            </button>
            <button
              onClick={() => setIsFunctionLocked(!isFunctionLocked)}
              title="Toggle Node Data Interaction"
              className={`px-3 py-1 rounded border text-[10px] font-mono transition-colors ${isFunctionLocked ? 'bg-red-900/30 border-red-500/50 text-red-400 hover:bg-red-900/50' : 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/50'}`}
            >
              F: {isFunctionLocked ? '🔒 L' : '🔓 U'}
            </button>
          </div>
        )}

        <button 
          onClick={() => {
            localStorage.removeItem('rfn_nodes');
            localStorage.removeItem('rfn_edges');
            localStorage.setItem('rfn_master_layout', JSON.stringify(DEFAULT_LAYOUT));
            window.location.reload();
          }}
          className="px-3 py-1 rounded bg-red-900/30 border border-red-500/50 text-[10px] font-mono text-red-400 hover:bg-red-900/50 transition-colors"
        >
          RESET LAYOUT
        </button>

        <div className="px-3 py-1 rounded bg-dark-800 border border-yellow-500/50 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse pointer-events-none" />
          <span className="text-[10px] font-mono text-yellow-400 tracking-wider pointer-events-none">MOCK MODE ACTIVE</span>
        </div>
        <div className="w-px h-6 bg-gray-800" />
        {/* Token Counter USD */}
        <div className="flex items-center gap-2 text-xs font-mono px-2 py-1 bg-dark-900 border border-green-500/30 rounded">
          <span className="text-gray-500">TOKEN COST (USD):</span>
          <span className="text-neon-green text-glow-green">${totalUSD}</span>
        </div>
        <div className="w-px h-6 bg-gray-800" />
        <div className="flex items-center gap-2 text-xs font-mono pointer-events-none">
          <span className="text-gray-500">SYS_STATUS:</span>
          <span className="text-neon-green text-glow-green">ONLINE</span>
        </div>
      </div>
    </header>
  );
};

export default HUD;
