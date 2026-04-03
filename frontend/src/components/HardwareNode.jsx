import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow, NodeResizer } from '@xyflow/react';
import axios from 'axios';
import { useEditMode } from '../contexts/EditModeContext';
import { RotatableNodeWrapper } from './FlowCanvas';

const StatusDot = ({ active }) => (
  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${active ? 'bg-neon-red shadow-[0_0_8px_#ff0044]' : 'bg-gray-500'}`} />
);

const HardwareNode = ({ id, data, selected }) => {
  const { updateNodeData } = useReactFlow();
  const { editMode, isMovementLocked, isFunctionLocked } = useEditMode();

  const [goalName, setGoalName] = useState(data?.goalName ?? 'RTX 5090');
  const [targetBudget, setTargetBudget] = useState(data?.targetBudget ?? 2000);
  const [currentSaved, setCurrentSaved] = useState(data?.currentSaved ?? 0);

  const [cpuUsage, setCpuUsage] = useState(0);
  const [ramUsage, setRamUsage] = useState(0);
  const [sysStatus, setSysStatus] = useState("DISCONNECTED");

  const progress = Number(targetBudget) > 0 ? Math.min((Number(currentSaved) / Number(targetBudget)) * 100, 100) : 0;

  const handleUpdate = (updates) => {
    updateNodeData(id, updates);
  };

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/telemetry/stats');
        setCpuUsage(Number(res.data.cpu_usage_pct) || 0);
        setRamUsage(Number(res.data.ram_usage_pct) || 0);
        setSysStatus(res.data.status || "IDLE");
      } catch {
        setCpuUsage(0);
        setRamUsage(0);
        setSysStatus("OFFLINE");
      }
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <RotatableNodeWrapper id={id} rotation={data?.rotation ?? 0} isMovementLocked={isMovementLocked} editMode={editMode} minWidth={240} minHeight={150}>
    <div className={`relative min-w-[240px] rounded-xl ${selected ? 'ring-2 ring-red-500' : ''} ${editMode ? 'node-edit-active' : 'node-idle'} pointer-events-none h-full`}>
      <div className={`border ${editMode && !isMovementLocked ? 'border-dashed border-2 border-amber-500' : 'border-red-500/30'} rounded-xl p-4 overflow-hidden relative w-full h-full pointer-events-auto`}
           style={{ background: 'linear-gradient(135deg, #1a0005 0%, #0f1629 100%)' }}>
        {sysStatus === "OFFLINE" && (
          <div className="absolute inset-0 bg-red-900/40 backdrop-blur-md z-50 flex items-center justify-center pointer-events-none">
             <div className="text-red-400 font-hud tracking-widest text-lg animate-pulse border-2 border-red-500/50 bg-black/80 px-4 py-2 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,0,68,0.2)_10px,rgba(255,0,68,0.2)_20px)]" />
                OFFLINE
             </div>
          </div>
        )}
        {editMode && <div className="absolute top-2 right-2 text-amber-500/80 text-[10px] animate-[spin_6s_linear_infinite]">⚙️</div>}
        
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/40
                          flex items-center justify-center text-lg">
            💻
          </div>
          <div>
            <div className="font-hud text-xs text-red-400 tracking-widest">NODE-HW</div>
            <div className="font-body text-sm font-semibold text-white">Hardware Monitor</div>
          </div>
          <div className="ml-auto flex items-center">
            <StatusDot active={progress >= 100} />
          </div>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <label className="text-gray-400 block mb-1">GOAL NAME</label>
            <input 
              type="text" 
              disabled={isFunctionLocked}
              value={goalName}
              onChange={(e) => {
                setGoalName(e.target.value);
                handleUpdate({ goalName: e.target.value });
              }}
              className="w-full bg-dark-900 border border-red-500/20 rounded px-2 py-1.5
                         text-white focus:outline-none focus:border-red-500/60 pointer-events-auto disabled:opacity-50"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-gray-400 block mb-1">SAVED ($)</label>
              <input 
                type="number" 
                disabled={isFunctionLocked}
                value={currentSaved}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  setCurrentSaved(val);
                  handleUpdate({ currentSaved: val });
                }}
                className="w-full bg-dark-900 border border-red-500/20 rounded px-2 py-1.5
                           text-white focus:outline-none focus:border-red-500/60 pointer-events-auto disabled:opacity-50"
              />
            </div>
            <div className="flex-1">
              <label className="text-gray-400 block mb-1">TARGET ($)</label>
              <input 
                type="number" 
                disabled={isFunctionLocked}
                value={targetBudget}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  setTargetBudget(val);
                  handleUpdate({ targetBudget: val });
                }}
                className="w-full bg-dark-900 border border-red-500/20 rounded px-2 py-1.5
                           text-white focus:outline-none focus:border-red-500/60 pointer-events-auto disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className="text-red-400">FINANCIAL PROGRESS</span>
            <span className="text-red-400">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-dark-900 rounded-full overflow-hidden border border-red-500/20">
            <div 
              className="h-full bg-red-500 shadow-[0_0_10px_#ff0044] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 border-t border-red-500/20 pt-3">
          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className="text-red-400 truncate w-24">CPU [{sysStatus}]</span>
            <span className="text-red-400">{cpuUsage.toFixed(1)}%</span>
          </div>
          <div className="w-full h-1.5 bg-dark-900 rounded-full overflow-hidden mb-2 border border-red-500/20">
            <div className="h-full bg-orange-500 shadow-[0_0_8px_#ff6b00] transition-all duration-500" style={{ width: `${cpuUsage}%` }} />
          </div>

          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className="text-red-400">RAM ALLOC</span>
            <span className="text-red-400">{ramUsage.toFixed(1)}%</span>
          </div>
          <div className="w-full h-1.5 bg-dark-900 rounded-full overflow-hidden border border-red-500/20">
            <div className="h-full bg-purple-500 shadow-[0_0_8px_#bf00ff] transition-all duration-500" style={{ width: `${ramUsage}%` }} />
          </div>
        </div>
      </div>

      <Handle id="hw-in" type="target" position={Position.Top} isConnectable={true} style={{ top: -5, background: '#ff0044', border: 'none', boxShadow: '0 0 8px #ff0044', zIndex: 999, pointerEvents: 'auto' }} />
      <Handle id="hw-out" type="source" position={Position.Bottom} isConnectable={true} style={{ bottom: -5, background: '#ff0044', border: 'none', boxShadow: '0 0 8px #ff0044', zIndex: 999, pointerEvents: 'auto' }} />
    </div>
    </RotatableNodeWrapper>
  );
};

export default HardwareNode;
