import React, { useState } from 'react';
import { Handle, Position, useReactFlow, NodeResizer } from '@xyflow/react';
import { useEditMode } from '../contexts/EditModeContext';
import { RotatableNodeWrapper } from './FlowCanvas';
import axios from 'axios';

const DecisionNode = ({ id, data, selected }) => {
  const { updateNodeData } = useReactFlow();
  const { editMode, isMovementLocked, isFunctionLocked } = useEditMode();
  const [conditionMet, setConditionMet] = useState(null); // null = pending, true = pass, false = fail

  const [textInput, setTextInput] = useState(data?.textInput ?? "");

  const checkCondition = async () => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/decision', {
        text: textInput,
        min_words: 200
      });
      const passed = res.data.passed;
      setConditionMet(passed);
      updateNodeData(id, { passed, textInput });
    } catch (err) {
      console.warn("Decision API Check Failed", err);
      setConditionMet(false);
      updateNodeData(id, { passed: false, textInput });
    }
  };

  const statusColor = conditionMet === null ? 'border-amber-500/40 text-amber-500' :
                      conditionMet === true ? 'border-neon-green/80 text-neon-green shadow-[0_0_15px_#39ff14]' :
                      'border-neon-red/80 text-neon-red shadow-[0_0_15px_#ff0044]';

  return (
    <RotatableNodeWrapper id={id} rotation={data?.rotation ?? 0} isMovementLocked={isMovementLocked} editMode={editMode} minWidth={180} minHeight={180}>
      <div className={`relative min-w-[180px] min-h-[180px] pointer-events-none h-full flex items-center justify-center
                       ${selected ? 'ring-2 ring-amber-500 ring-offset-4 ring-offset-dark-950' : ''}`}>
        
        {/* Diamond Shape Wrapper using CSS Rotation */}
        <div className={`absolute inset-0 border-2 ${statusColor} bg-dark-900 overflow-hidden pointer-events-auto
                         transition-all duration-300`}
             style={{ transform: 'rotate(45deg)', background: 'linear-gradient(135deg, #1f1100 0%, #0f1629 100%)', borderRadius: '15px' }}>
             {/* Diagonal inner scanline */}
             <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(245,158,11,0.05)_50%)] bg-[length:100%_4px]" />
        </div>

        {/* Unrotated Content inside the Diamond */}
        <div className="relative z-10 p-4 text-center pointer-events-auto w-[160px]">
          {editMode && <div className="absolute -top-4 right-2 text-amber-500/80 text-[10px] animate-[spin_6s_linear_infinite]">⚙️</div>}
          <div className="font-hud text-xs text-amber-400 tracking-widest mb-1">DECISION</div>
          <div className="font-mono text-[9px] text-gray-400 uppercase leading-snug mb-2">
            Length &gt; 200 words
          </div>
          
          <textarea
            disabled={isFunctionLocked}
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              updateNodeData(id, { textInput: e.target.value });
            }}
            placeholder="Payload input..."
            className="w-full h-12 bg-dark-950 border border-amber-500/20 rounded resize-none text-[8px] font-mono p-1 text-gray-300 focus:outline-none focus:border-amber-500/60 custom-scrollbar pointer-events-auto nodrag"
          />
          
          <button
            disabled={isFunctionLocked}
            onClick={checkCondition}
            className="mt-3 px-3 py-1 bg-dark-950 border border-amber-500/30 text-amber-500 text-[10px] font-mono rounded hover:bg-amber-500/10 transition-colors w-full"
          >
            VALIDATE
          </button>

          {conditionMet !== null && (
            <div className={`mt-2 text-xs font-hud tracking-widest ${conditionMet ? 'text-neon-green' : 'text-neon-red'}`}>
              {conditionMet ? '✓ PASS' : '✗ FAIL'}
            </div>
          )}
        </div>

        {/* Input Handle (Top left edge of the diamond effectively) */}
        <Handle id="decision-in" type="target" position={Position.Top} className="!w-3 !h-3 !bg-amber-500 !border-2 !border-dark-900" style={{ top: '-6px', zIndex: 999 }} />
        
        {/* Pass Output (Right) */}
        <Handle id="decision-pass" type="source" position={Position.Right} className="!w-3 !h-3 !bg-neon-green !border-2 !border-dark-900" style={{ right: '-6px', zIndex: 999 }} />
        
        {/* Fail Output (Bottom) */}
        <Handle id="decision-fail" type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-neon-red !border-2 !border-dark-900" style={{ bottom: '-6px', zIndex: 999 }} />
      </div>
    </RotatableNodeWrapper>
  );
};

export default DecisionNode;
