import React, { useState, useEffect, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import FlowCanvas from './components/FlowCanvas';
import Sidebar from './components/Sidebar';
import { EditModeContext } from './contexts/EditModeContext';

export const DEFAULT_LAYOUT = {
  "status-header": { "id": "status-header", "x": 6, "y": 9, "r": 0, "w": "auto", "h": "auto" },
  "palette-sidebar": { "id": "palette-sidebar", "x": 8, "y": 78, "r": 0, "w": "auto", "h": "auto" },
  "undo-redo-panel": { "id": "undo-redo-panel", "x": 280, "y": 84, "r": 0, "w": "auto", "h": "auto" },
  "canvas_controls": { "id": "canvas_controls", "x": 281, "y": 125, "r": 0, "w": "auto", "h": "auto" },
  "inspector": { "id": "inspector", "x": 1052, "y": 250, "r": 0, "w": "auto", "h": "auto" },
  "minimap-panel": { "id": "minimap-panel", "x": 1093, "y": 39, "r": 0, "w": "auto", "h": "auto" },
  "canvas-mode-toggle": { "id": "canvas-mode-toggle", "x": 10, "y": 504, "r": 0, "w": "auto", "h": "auto" }
};

export const DraggablePanel = ({ id, children, defaultPos, disabled, editModeContext, className }) => {
  const panelRef = useRef(null);
  const isReady = useRef(false);

  const [pos, setPos] = useState(() => {
    try {
      let master = {};
      const saved = localStorage.getItem('rfn_master_layout');
      if (saved) {
        master = JSON.parse(saved);
      } else {
        master = DEFAULT_LAYOUT;
        localStorage.setItem('rfn_master_layout', JSON.stringify(master));
      }
      
      const parsed = master[id];
      if (parsed) {
        return { x: parsed.x, y: parsed.y, r: parsed.r || 0, w: parsed.w || 'auto', h: parsed.h || 'auto' };
      }
    } catch (e) {}
    return { ...defaultPos, r: 0, w: 'auto', h: 'auto' };
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      isReady.current = true;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const saveToMaster = (currentPos) => {
    if (!isReady.current) return;
    try {
      const saved = localStorage.getItem('rfn_master_layout');
      const master = saved ? JSON.parse(saved) : {};
      master[id] = { id, x: currentPos.x, y: currentPos.y, r: currentPos.r, w: currentPos.w, h: currentPos.h };
      localStorage.setItem('rfn_master_layout', JSON.stringify(master));
    } catch (e) {}
  };

  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!panelRef.current || disabled) return;
    const ob = new ResizeObserver((entries) => {
      for (let e of entries) {
        setPos(prev => { 
          const currentW = prev.w === 'auto' ? e.contentRect.width : prev.w;
          const currentH = prev.h === 'auto' ? e.contentRect.height : prev.h;
          if (Math.abs(e.contentRect.width - currentW) > 5 || Math.abs(e.contentRect.height - currentH) > 5) {
             const n = { ...prev, w: e.contentRect.width, h: e.contentRect.height };
             saveToMaster(n);
             return n;
          }
          return prev;
        });
      }
    });
    
    ob.observe(panelRef.current);
    
    return () => {
      ob.disconnect();
    };
  }, [id, disabled]);

  const onPointerDown = (e) => {
    if (disabled || e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    e.target.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    try {
      if (isDragging) {
        let newX = Math.max(0, Math.min(e.clientX - startPos.x, window.innerWidth - 100));
        let newY = Math.max(0, Math.min(e.clientY - startPos.y, window.innerHeight - 50));
        setPos(p => ({ ...p, x: newX, y: newY }));
      } else if (isRotating && panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect();
        if (!rect || rect.width === 0) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90;
        setPos(p => ({ ...p, r: Number.isNaN(angle) ? p.r : angle }));
      }
    } catch (err) {
      console.warn('Pointer move aborted', err);
    }
  };

  const onPointerUp = (e) => {
    if (isDragging || isRotating) {
      if (e.target.hasPointerCapture(e.pointerId)) e.target.releasePointerCapture(e.pointerId);
      setPos(currentPos => {
        saveToMaster(currentPos);
        return currentPos;
      });
      setIsDragging(false);
      setIsRotating(false);
    }
  };

  return (
    <div 
      ref={panelRef}
      className={`absolute z-[1000] ${disabled ? '' : 'border-2 border-dashed border-cyan-500 cursor-move'} ${isDragging || isRotating ? 'ring-2 ring-neon-cyan shadow-[0_0_15px_rgba(0,245,255,0.4)]' : ''} ${className}`}
      style={{ 
        transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.r}deg)`,
        backgroundColor: 'rgba(10, 10, 15, 0.9)',
        backdropFilter: 'blur(10px)',
        width: pos.w,
        height: pos.h,
        resize: disabled ? 'none' : 'both',
        overflow: 'visible' // CRITICAL FIX: prevents cutting off the rotation anchor
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {editModeContext && !disabled && (
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-4 bg-neon-cyan border-2 border-white rounded-full cursor-alias z-[1001]"
          onPointerDown={(e) => { e.stopPropagation(); setIsRotating(true); e.target.setPointerCapture(e.pointerId); }}
        />
      )}
      {children}
    </div>
  );
};

function App() {
  const [editMode, setEditMode] = useState(false);
  const [isMovementLocked, setIsMovementLocked] = useState(() => {
    localStorage.removeItem('rfn_layout_locked');
    const lockSaved = localStorage.getItem('rfn_movement_locked');
    return lockSaved ? JSON.parse(lockSaved) : true;
  });

  const [isFunctionLocked, setIsFunctionLocked] = useState(() => {
    const lockSaved = localStorage.getItem('rfn_function_locked');
    return lockSaved ? JSON.parse(lockSaved) : true;
  });
  const [selectedNode, setSelectedNode] = useState(null);

  const toggleEditMode = () => {
    const nextEdit = !editMode;
    setEditMode(nextEdit);
    if (nextEdit) {
      setIsMovementLocked(true);
      setIsFunctionLocked(true);
      localStorage.setItem('rfn_movement_locked', JSON.stringify(true));
      localStorage.setItem('rfn_function_locked', JSON.stringify(true));
    }
  };

  const toggleMovementLock = () => {
    const lock = !isMovementLocked;
    setIsMovementLocked(lock);
    localStorage.setItem('rfn_movement_locked', JSON.stringify(lock));
  };

  const toggleFunctionLock = () => {
    const lock = !isFunctionLocked;
    setIsFunctionLocked(lock);
    localStorage.setItem('rfn_function_locked', JSON.stringify(lock));
  };

  const [totalTokens, setTotalTokens] = useState(0);

  return (
    <EditModeContext.Provider value={{ editMode, setEditMode, isMovementLocked, setIsMovementLocked, isFunctionLocked, setIsFunctionLocked, totalTokens, setTotalTokens }}>
      <div className="h-screen w-screen flex flex-col bg-dark-950 font-sans text-white overflow-hidden relative">
        {/* Main Workspace */}
        <div className="absolute inset-0 flex flex-col pointer-events-auto">
          <ReactFlowProvider>
            <FlowCanvas onNodeSelect={setSelectedNode} />
          </ReactFlowProvider>
        </div>

        {/* HUD Header */}
        <DraggablePanel id="status-header" defaultPos={{ x: window.innerWidth / 2 - 350, y: 20 }} disabled={!editMode || isMovementLocked} editModeContext={editMode} className="shadow-2xl rounded-xl">
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
              <div className="flex items-center gap-2 bg-dark-900/50 border border-gray-600/30 rounded p-1 px-2">
                <span className={`text-[10px] font-mono tracking-widest pointer-events-none ${editMode ? 'text-amber-500 text-glow-amber' : 'text-gray-500'}`}>Modo Edición</span>
                <button 
                  onClick={toggleEditMode}
                  className={`relative w-9 h-4 rounded-full transition-colors border ${editMode ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-dark-900 border-gray-600'}`}
                >
                  <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-transform ${editMode ? 'translate-x-5 bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'translate-x-1 bg-gray-500'}`} />
                </button>
              </div>

              {editMode && (
                <div className="flex gap-[15px] items-center">
                  <button
                    onClick={toggleMovementLock}
                    title="Toggle Layout Dragging & Sizing"
                    className={`px-3 py-1 rounded border text-[10px] font-mono transition-colors ${isMovementLocked ? 'bg-orange-900/30 border-orange-500/50 text-orange-400 hover:bg-orange-900/50' : 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/50'}`}
                  >
                    M: {isMovementLocked ? '🔒 L' : '🔓 U'}
                  </button>
                  <button
                    onClick={toggleFunctionLock}
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
            <div className="flex items-center gap-2 text-xs font-mono px-2 py-1 bg-dark-900 border border-green-500/30 rounded">
              <span className="text-gray-500">TOKEN COST (USD):</span>
              <span className="text-neon-green text-glow-green">${(totalTokens * 0.00015).toFixed(4)}</span>
            </div>
            <div className="w-px h-6 bg-gray-800" />
            <div className="flex items-center gap-2 text-xs font-mono pointer-events-none">
              <span className="text-gray-500">SYS_STATUS:</span>
              <span className="text-neon-green text-glow-green">ONLINE</span>
            </div>
          </div>
        </header>
        </DraggablePanel>

        {/* Sidebar Component as Draggable Panel */}
        <DraggablePanel id="palette-sidebar" defaultPos={{ x: 20, y: 100 }} disabled={!editMode || isMovementLocked} editModeContext={editMode} className="shadow-2xl rounded-xl">
          <Sidebar />
        </DraggablePanel>

        {/* Right Inspector Panel */}
        {selectedNode && (
          <DraggablePanel id="inspector" defaultPos={{ x: window.innerWidth - 300, y: 80 }} disabled={!editMode || isMovementLocked} editModeContext={editMode} className="shadow-2xl">
            <aside className="w-72 bg-dark-900 border border-neon-cyan/20 rounded-xl p-4 flex flex-col shrink-0 transition-all">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xs font-hud text-neon-cyan tracking-widest text-glow-cyan">INSPECTOR</h2>
                 <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white transition-colors">✕</button>
               </div>
               <div className="h-px bg-gradient-to-r from-neon-cyan/50 to-transparent mb-4" />
               
               <div className="space-y-4 font-mono text-xs text-gray-300">
                 <div>
                   <label className="text-[10px] text-gray-500 block mb-1">NODE ID</label>
                   <div className="bg-dark-950 border border-gray-800 p-2 rounded">{selectedNode.id}</div>
                 </div>
                 <div>
                   <label className="text-[10px] text-gray-500 block mb-1">NODE TYPE</label>
                   <div className="bg-dark-950 border border-gray-800 p-2 rounded text-neon-cyan">{selectedNode.type}</div>
                 </div>
                 <div>
                   <label className="text-[10px] text-gray-500 block mb-1">DATA PAYLOAD</label>
                   <pre className="bg-dark-950 border border-gray-800 p-2 rounded overflow-x-auto text-[10px] text-green-400">
                     {JSON.stringify(selectedNode.data, null, 2)}
                   </pre>
                 </div>
               </div>
            </aside>
          </DraggablePanel>
        )}
        
        {/* HUD Footer */}
        <footer className="absolute bottom-0 w-full h-6 bg-dark-950 border-t border-neon-cyan/20 flex items-center px-4 justify-between shrink-0 text-[10px] font-mono text-gray-600 z-[9000] pointer-events-none">
          <div>SECURE CONNECTION ESTABLISHED</div>
          <div className="flex gap-4">
             <span>LATENCY: 12ms</span>
             <span>CPU: 4%</span>
             <span>MEM: 128MB</span>
          </div>
        </footer>
      </div>
    </EditModeContext.Provider>
  );
}

export default App;
