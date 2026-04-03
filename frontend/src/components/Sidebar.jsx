import React from 'react';

const Sidebar = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/rfn-node', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-dark-900 border-r border-neon-cyan/20 p-4 flex flex-col h-full shrink-0 relative transition-all">
      {/* Corner Brackets */}
      <div className="corner-bracket corner-bracket-tl absolute top-0 left-0" />
      <div className="corner-bracket corner-bracket-br absolute bottom-0 right-0" />
      
      <div className="mb-6">
        <h2 className="text-xs font-hud text-neon-cyan tracking-widest mb-1 text-glow-cyan">NODE PALETTE</h2>
        <div className="h-px bg-gradient-to-r from-neon-cyan/50 to-transparent mb-4" />
        
        <div className="space-y-3">
          <div
            className="p-3 border border-orange-500/30 bg-orange-500/10 rounded cursor-grab hover:bg-orange-500/20 transition-colors"
            onDragStart={(event) => onDragStart(event, 'redditSource')}
            draggable
          >
            <div className="text-xs font-hud text-orange-400">🔴 Reddit Source</div>
          </div>

          <div
            className="p-3 border border-neon-cyan/30 bg-neon-cyan/10 rounded cursor-grab hover:bg-neon-cyan/20 transition-colors"
            onDragStart={(event) => onDragStart(event, 'promptRefiner')}
            draggable
          >
            <div className="text-xs font-hud text-neon-cyan">🤖 Prompt Refiner</div>
          </div>

          <div
            className="p-3 border border-purple-500/30 bg-purple-500/10 rounded cursor-grab hover:bg-purple-500/20 transition-colors"
            onDragStart={(event) => onDragStart(event, 'humanApproval')}
            draggable
          >
            <div className="text-xs font-hud text-purple-400">👁️ Human Approval</div>
          </div>

          <div
            className="p-3 border border-neon-green/30 bg-neon-green/10 rounded cursor-grab hover:bg-neon-green/20 transition-colors"
            onDragStart={(event) => onDragStart(event, 'publisher')}
            draggable
          >
            <div className="text-xs font-hud text-neon-green">🚀 Publisher</div>
          </div>

          <div
            className="p-3 border border-red-500/30 bg-red-500/10 rounded cursor-grab hover:bg-red-500/20 transition-colors"
            onDragStart={(event) => onDragStart(event, 'hardwareNode')}
            draggable
          >
            <div className="text-xs font-hud text-red-400">💻 Hardware Monitor</div>
          </div>

          <div
            className="p-3 border border-amber-500/30 bg-amber-500/10 rounded cursor-grab hover:bg-amber-500/20 transition-colors"
            onDragStart={(event) => onDragStart(event, 'decisionNode')}
            draggable
          >
            <div className="text-xs font-hud text-amber-400 text-glow-amber">⟁ Decision Gate</div>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <h2 className="text-xs font-hud text-gray-400 tracking-widest mb-1">BLUEPRINTS</h2>
        <div className="h-px bg-gradient-to-r from-gray-600/50 to-transparent mb-3" />
        <div className="flex gap-2">
           <button className="flex-1 py-1.5 text-xs font-mono border border-gray-600 text-gray-400 rounded hover:border-neon-cyan hover:text-neon-cyan transition-colors">
             IMPORT
           </button>
           <button className="flex-1 py-1.5 text-xs font-mono border border-gray-600 text-gray-400 rounded hover:border-neon-cyan hover:text-neon-cyan transition-colors">
             EXPORT
           </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
