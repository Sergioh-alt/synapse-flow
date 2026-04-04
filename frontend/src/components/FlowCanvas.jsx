import React, { useCallback, useState, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Panel,
  MarkerType,
  NodeResizer,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import axios from 'axios'
import { EditModeContext, useEditMode } from '../contexts/EditModeContext'
import HardwareNode from './HardwareNode'
import DecisionNode from './DecisionNode'
import { DraggablePanel } from '../App'
// ============================================================
// Helper: Rotation & Resize Wrapper
// ============================================================
export const RotatableNodeWrapper = ({ id, rotation, children, isMovementLocked, editMode, minWidth = 150, minHeight = 100 }) => {
  const { updateNodeData } = useReactFlow();
  const [rot, setRot] = useState(Number(rotation) || 0);
  const [isRotating, setIsRotating] = useState(false);
  const nodeRef = React.useRef(null);

  const onPointerDown = (e) => {
    e.stopPropagation();
    setIsRotating(true);
    e.target.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    try {
      if (!isRotating || !nodeRef.current) return;
      const rect = nodeRef.current.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90;
      setRot(prev => Number.isNaN(angle) ? prev : angle);
    } catch (err) {
      console.warn('Rotation calculation aborted', err);
    }
  };

  const onPointerUp = (e) => {
    if (isRotating) {
      if (e.target.hasPointerCapture(e.pointerId)) e.target.releasePointerCapture(e.pointerId);
      updateNodeData(id, { rotation: rot });
      setIsRotating(false);
    }
  };

  return (
    <div 
      ref={nodeRef}
      className={`relative w-full h-full pointer-events-auto`}
      style={{ transform: `rotate(${rot}deg)` }}
    >
      <NodeResizer minWidth={minWidth} minHeight={minHeight} isVisible={editMode && !isMovementLocked} />
      
      {editMode && !isMovementLocked && (
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-4 bg-neon-cyan border-2 border-white rounded-full cursor-alias z-[1001] nodrag"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      )}
      {children}
    </div>
  );
};

// ============================================================
// Helper: Status badge
// ============================================================
const StatusDot = ({ status }) => {
  const colors = {
    idle: 'bg-gray-600',
    pending: 'bg-yellow-400 animate-pulse',
    processing: 'bg-neon-green animate-pulse shadow-neon-green',
    completed: 'bg-neon-cyan shadow-neon-cyan',
    approved: 'bg-neon-green shadow-neon-green',
    rejected: 'bg-red-500',
    error: 'bg-red-500',
  }
  return (
    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${colors[status] ?? 'bg-gray-500'}`} />
  )
}

// ============================================================
// NODE: Reddit Source
// ============================================================
const RedditSourceNode = ({ id, data, selected }) => {
  const { editMode, isMovementLocked, isFunctionLocked } = useEditMode()
  const [subreddit, setSubreddit] = useState(data?.subreddit ?? 'MachineLearning')
  const [keyword, setKeyword] = useState(data?.keyword ?? '')
  const [status, setStatus] = useState('idle')
  const [posts, setPosts] = useState([])

  const handleFetch = async () => {
    setStatus('processing')
    try {
      const res = await axios.get(`/api/mock/trending/${subreddit}?limit=5`)
      setPosts(res.data.posts || [])
      setStatus('completed')
      data?.onFetch?.({ subreddit, keyword, posts: res.data.posts })
    } catch {
      setStatus('error')
    }
  }

  return (
    <RotatableNodeWrapper id={id} rotation={data?.rotation ?? 0} isMovementLocked={isMovementLocked} editMode={editMode} minWidth={240} minHeight={150}>
    <div className={`relative min-w-[240px] rounded-xl ${selected ? 'ring-2 ring-neon-cyan' : ''} ${editMode ? 'node-edit-active' : 'node-idle'} h-full pointer-events-none`}>
      <div className={`bg-dark-700 border ${editMode && !isMovementLocked ? 'border-dashed border-2 border-amber-500' : 'border-orange-600/30'} rounded-xl p-4 overflow-hidden relative w-full h-full pointer-events-auto`}
           style={{ background: 'linear-gradient(135deg, #1e1000 0%, #0f1629 100%)' }}>
        {editMode && <div className="absolute top-2 right-2 text-amber-500/80 text-[10px] animate-[spin_6s_linear_infinite]">⚙️</div>}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-500/40
                          flex items-center justify-center text-lg">🔴</div>
          <div>
            <div className="font-hud text-xs text-orange-400 tracking-widest">NODE-01</div>
            <div className="font-body text-sm font-semibold text-white">Reddit Source</div>
          </div>
          <div className="ml-auto flex items-center">
            <StatusDot status={status} />
            <span className="text-xs font-mono text-gray-400 capitalize">{status}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-400 font-mono">SUBREDDIT</label>
            <div className="flex items-center mt-1">
              <span className="text-orange-400 text-sm font-mono mr-1">r/</span>
              <input
                disabled={isFunctionLocked}
                value={subreddit}
                onChange={e => setSubreddit(e.target.value)}
                className="flex-1 bg-dark-900 border border-orange-500/20 rounded px-2 py-1
                           text-sm text-white font-mono focus:outline-none focus:border-orange-500/60 disabled:opacity-50"
                placeholder="subreddit"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-mono">KEYWORD FILTER</label>
            <input
              disabled={isFunctionLocked}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="w-full mt-1 bg-dark-900 border border-orange-500/20 rounded px-2 py-1
                         text-sm text-white font-mono focus:outline-none focus:border-orange-500/60 disabled:opacity-50"
              placeholder="optional keyword..."
            />
          </div>
        </div>

        <button
          onClick={handleFetch}
          disabled={status === 'processing'}
          className="mt-3 w-full py-1.5 rounded-lg text-xs font-hud tracking-widest
                     bg-orange-600/20 border border-orange-500/40 text-orange-300
                     hover:bg-orange-600/40 hover:border-orange-400 transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === 'processing' ? '⟳ FETCHING...' : '▶ FETCH POSTS'}
        </button>

        {posts.length > 0 && (
          <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
            {posts.slice(0, 3).map(p => (
              <div key={p.id} className="text-xs text-gray-400 font-mono truncate
                                         border-l-2 border-orange-500/30 pl-2">
                ↑{p.score} {p.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle id="redditSource-source" type="source" position={Position.Bottom} isConnectable={true}
              style={{ bottom: -5, background: '#ff6b00', boxShadow: '0 0 8px #ff6b00', zIndex: 999 }} />
    </div>
    </RotatableNodeWrapper>
  )
}

// ============================================================
// NODE: Prompt Refiner (AI Agent)
// ============================================================
const PromptRefinerNode = ({ id, data, selected }) => {
  const { editMode, isMovementLocked, isFunctionLocked, setTotalTokens } = useEditMode()
  const [rawIdea, setRawIdea] = useState(data?.rawIdea ?? '')
  const [provider, setProvider] = useState('litellm')
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)

  const handleRefine = async () => {
    if (!rawIdea.trim()) return
    setStatus('processing')
    try {
      // Usar endpoint de 3-fases
      const res = await axios.post('http://127.0.0.1:8000/refine/prompt', {
        raw_idea: rawIdea,
        provider: provider,
        iterations: 1
      })
      setResult(res.data)
      setStatus('completed')
      
      if (res.data.tokens_used && setTotalTokens) {
         setTotalTokens(prev => prev + res.data.tokens_used)
      }
      
      data?.onRefine?.(res.data)
    } catch {
      setStatus('error')
    }
  }

  return (
    <RotatableNodeWrapper id={id} rotation={data?.rotation ?? 0} isMovementLocked={isMovementLocked} editMode={editMode} minWidth={260} minHeight={150}>
    <div className={`relative min-w-[260px] rounded-xl
                     ${selected ? 'ring-2 ring-neon-cyan' : ''}
                     ${status === 'processing' ? 'node-processing' : 'node-idle'}
                     ${editMode ? 'node-edit-active' : ''} h-full pointer-events-none`}>
      <div className={`border ${editMode && !isMovementLocked ? 'border-dashed border-2 border-amber-500' : 'border-neon-cyan/20'} rounded-xl p-4 overflow-hidden relative w-full h-full pointer-events-auto`}
           style={{ background: 'linear-gradient(135deg, #001e20 0%, #0f1629 100%)' }}>
        {editMode && <div className="absolute top-2 right-2 text-amber-500/80 text-[10px] animate-[spin_6s_linear_infinite]">⚙️</div>}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30
                          flex items-center justify-center text-lg">🤖</div>
          <div>
            <div className="font-hud text-xs text-neon-cyan tracking-widest">NODE-02</div>
            <div className="font-body text-sm font-semibold text-white">AI Prompt Refiner</div>
          </div>
          <div className="ml-auto flex items-center">
            <StatusDot status={status} />
            <span className="text-xs font-mono text-gray-400 capitalize">{status}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-400 font-mono">RAW IDEA / PROMPT</label>
            <textarea
              disabled={isFunctionLocked}
              value={rawIdea}
              onChange={e => setRawIdea(e.target.value)}
              rows={3}
              className="w-full mt-1 bg-dark-900 border border-neon-cyan/20 rounded px-2 py-1.5
                         text-xs text-neon-cyan/80 font-mono focus:outline-none focus:border-neon-cyan/60 resize-none disabled:opacity-50"
              placeholder="Describe your Reddit content idea..."
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <label className="text-xs text-gray-400 font-mono">LLM PROVIDER</label>
            <select
              disabled={isFunctionLocked}
              value={provider}
              onChange={e => setProvider(e.target.value)}
              className="bg-dark-900 border border-neon-cyan/30 text-neon-cyan text-xs font-hud rounded px-2 py-1 outline-none focus:border-neon-cyan disabled:opacity-50"
            >
              <option value="litellm">GPT/Claude (LiteLLM)</option>
              <option value="groq">Llama-3 (Groq)</option>
              <option value="ollama">Local (Ollama)</option>
            </select>
          </div>
        </div>



        <button
          onClick={handleRefine}
          disabled={status === 'processing' || !rawIdea.trim()}
          className="mt-3 w-full py-1.5 rounded-lg text-xs font-hud tracking-widest
                     bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan
                     hover:bg-neon-cyan/20 hover:border-neon-cyan/60 transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === 'processing' ? '⟳ REFINING...' : '▶ REFINE PROMPT'}
        </button>

        {result && (
          <div className="mt-2 bg-dark-900/80 rounded p-2 text-[10px] font-mono text-neon-cyan/80
                          border border-neon-cyan/10 max-h-[100px] overflow-y-auto whitespace-pre-wrap">
            ✓ Routed via: {result.provider_matched?.toUpperCase()} (3-Pass)
            ✓ Cost: {result.tokens_used} TKs
            {"\n\n"}— PROPOSAL —{"\n"}
            {result.proposed?.substring(0, 80)}...
            {"\n\n"}— CRITIQUE —{"\n"}
            {result.critique?.substring(0, 80)}...
            {"\n\n"}— FINAL SYNTHESIS —{"\n"}
            {result.final}
          </div>
        )}
      </div>
      <Handle id="promptRefiner-target" type="target" position={Position.Top}
              style={{ top: -5, background: '#00f5ff', boxShadow: '0 0 8px #00f5ff', zIndex: 999 }} />
      <Handle id="promptRefiner-source" type="source" position={Position.Bottom} isConnectable={true}
              style={{ bottom: -5, background: '#00f5ff', boxShadow: '0 0 8px #00f5ff', zIndex: 999 }} />
    </div>
    </RotatableNodeWrapper>
  )
}

// ============================================================
// NODE: Human Approval Gate
// ============================================================
const HumanApprovalNode = ({ id, data, selected }) => {
  const { editMode, isMovementLocked, isFunctionLocked } = useEditMode()
  const [approved, setApproved] = useState(data?.approved ?? false)
  const [rejected, setRejected] = useState(false)

  const handleApprove = () => {
    setApproved(true)
    setRejected(false)
    data?.onChange?.({ approved: true })
  }
  const handleReject = () => {
    setApproved(false)
    setRejected(true)
    data?.onChange?.({ approved: false })
  }

  const borderColor = approved ? 'border-neon-green/40' : rejected ? 'border-red-500/40' : 'border-purple-500/30'
  const bg = approved ? '#001a00' : rejected ? '#1a0000' : '#0d001a'

  return (
    <RotatableNodeWrapper id={id} rotation={data?.rotation ?? 0} isMovementLocked={isMovementLocked} editMode={editMode} minWidth={220} minHeight={120}>
    <div className={`relative min-w-[220px] rounded-xl
                     ${selected ? 'ring-2 ring-neon-purple' : ''} node-idle
                     ${editMode ? 'node-edit-active' : ''} h-full pointer-events-none`}>
      <div className={`border ${editMode && !isMovementLocked ? 'border-dashed border-2 border-amber-500' : borderColor} rounded-xl p-4 overflow-hidden relative w-full h-full pointer-events-auto`}
           style={{ background: `linear-gradient(135deg, ${bg} 0%, #0f1629 100%)` }}>
        {editMode && <div className="absolute top-2 right-2 text-amber-500/80 text-[10px] animate-[spin_6s_linear_infinite]">⚙️</div>}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40
                          flex items-center justify-center text-lg">
            {approved ? '✅' : rejected ? '❌' : '👁️'}
          </div>
          <div>
            <div className="font-hud text-xs text-purple-400 tracking-widest">NODE-03</div>
            <div className="font-body text-sm font-semibold text-white">Human Approval</div>
          </div>
        </div>

        <div className="text-xs text-gray-400 font-mono mb-3 leading-relaxed">
          Review the refined blueprint before publishing. This gate prevents automated posting.
        </div>

        <div className="flex gap-2">
          <button
            id="approval-approve-btn"
            onClick={handleApprove}
            disabled={isFunctionLocked}
            className={`flex-1 py-2 rounded-lg text-xs font-hud tracking-widest transition-all disabled:opacity-50
                       ${approved
                ? 'bg-neon-green/30 border border-neon-green/70 text-neon-green shadow-neon-green'
                : 'bg-dark-900 border border-green-600/40 text-green-400 hover:bg-green-600/20'}`}
          >
            ✓ APPROVE
          </button>
          <button
            id="approval-reject-btn"
            onClick={handleReject}
            disabled={isFunctionLocked}
            className={`flex-1 py-2 rounded-lg text-xs font-hud tracking-widest transition-all disabled:opacity-50
                       ${rejected 
                ? 'bg-red-600/30 border border-red-500/70 text-red-400'
                : 'bg-dark-900 border border-red-600/40 text-red-400 hover:bg-red-600/20'}`}
          >
            ✗ REJECT
          </button>
        </div>

        <div className={`mt-2 text-center text-xs font-hud tracking-widest
          ${approved ? 'text-neon-green text-glow-green' : rejected ? 'text-red-400' : 'text-gray-600'}`}>
          {approved ? '— GATE OPEN —' : rejected ? '— GATE CLOSED —' : '— AWAITING DECISION —'}
        </div>
      </div>
      {/* Handles */}
      <Handle id="human-target" type="target" position={Position.Top}
              style={{ top: -5, background: '#bf00ff', boxShadow: '0 0 8px #bf00ff', zIndex: 999 }} />
      <Handle id="human-source" type="source" position={Position.Bottom} isConnectable={approved}
              style={{ bottom: -5, background: approved ? '#bf00ff' : '#444', 
                       boxShadow: approved ? '0 0 8px #bf00ff' : 'none', zIndex: 999 }} />
    </div>
    </RotatableNodeWrapper>
  )
}

// ============================================================
// NODE: Reddit Publisher
// ============================================================
const PublisherNode = ({ id, data, selected }) => {
  const { editMode, isMovementLocked, isFunctionLocked } = useEditMode()
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [subreddit, setSubreddit] = useState(data?.subreddit ?? 'SideProject')

  const handlePublish = async () => {
    setStatus('processing')
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/mock/publish', {
        subreddit: data?.subreddit ?? 'SideProject',
        content: 'Flow automation pipeline test...'
      })
      setResult(res.data)
      setStatus('completed')
      data?.onPublish?.(res.data)
    } catch {
      setStatus('error')
    }
  }

  return (
    <RotatableNodeWrapper id={id} rotation={data?.rotation ?? 0} isMovementLocked={isMovementLocked} editMode={editMode} minWidth={240} minHeight={120}>
    <div className={`relative min-w-[240px] rounded-xl
                     ${selected ? 'ring-2 ring-neon-green' : ''}
                     ${status === 'processing' ? 'node-processing' : 'node-idle'}
                     ${editMode ? 'node-edit-active' : ''} h-full pointer-events-none`}>
      <div className={`border ${editMode && !isMovementLocked ? 'border-dashed border-2 border-amber-500' : 'border-neon-green/30'} rounded-xl p-4 overflow-hidden relative w-full h-full pointer-events-auto`}
           style={{ background: 'linear-gradient(135deg, #001a05 0%, #0f1629 100%)' }}>
        {editMode && <div className="absolute top-2 right-2 text-amber-500/80 text-[10px] animate-[spin_6s_linear_infinite]">⚙️</div>}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-neon-green/10 border border-neon-green/30
                          flex items-center justify-center text-lg">🚀</div>
          <div>
            <div className="font-hud text-xs text-neon-green tracking-widest">NODE-04</div>
            <div className="font-body text-sm font-semibold text-white">Reddit Publisher</div>
          </div>
          <div className="ml-auto flex items-center">
            <StatusDot status={status} />
            <span className="text-xs font-mono text-gray-400 capitalize">{status}</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 font-mono">TARGET SUBREDDIT</label>
          <div className="flex items-center mt-1">
            <span className="text-neon-green text-sm font-mono mr-1">r/</span>
            <input
              disabled={isFunctionLocked}
              value={subreddit}
              onChange={e => setSubreddit(e.target.value)}
              className="flex-1 bg-dark-900 border border-neon-green/20 rounded px-2 py-1
                         text-sm text-white font-mono focus:outline-none focus:border-neon-green/60 disabled:opacity-50"
              placeholder="SideProject"
            />
          </div>
        </div>

        <div className="mt-3 bg-dark-900/60 rounded p-2 border border-neon-green/10">
          <div className="text-xs font-mono text-gray-400 space-y-0.5">
            <div className="flex justify-between">
              <span>Rate Limit</span>
              <span className="text-neon-green">✓ Protected</span>
            </div>
            <div className="flex justify-between">
              <span>User-Agent</span>
              <span className="text-neon-green">✓ Compliant</span>
            </div>
            <div className="flex justify-between">
              <span>Mode</span>
              <span className="text-yellow-400">MOCK</span>
            </div>
          </div>
        </div>

        <button
          id="publisher-execute-btn"
          onClick={handlePublish}
          disabled={status === 'processing'}
          className="mt-3 w-full py-1.5 rounded-lg text-xs font-hud tracking-widest
                     bg-neon-green/10 border border-neon-green/30 text-neon-green
                     hover:bg-neon-green/20 hover:border-neon-green/60 transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === 'processing' ? '⟳ PUBLISHING...' : '🚀 EXECUTE PIPELINE'}
        </button>

        {result && (
          <div className="mt-2 bg-dark-900/80 rounded p-2 text-xs font-mono
                          border border-neon-green/20 text-neon-green/80">
            ✓ {result.status} → {result.post_id}
          </div>
        )}
        {status === 'error' && (
          <div className="mt-2 text-xs font-mono text-red-400">
            Pipeline error. Check backend connection.
          </div>
        )}
      </div>
      <Handle id="publisher-target" type="target" position={Position.Top}
              style={{ top: -5, background: '#39ff14', boxShadow: '0 0 8px #39ff14', zIndex: 999 }} />
    </div>
    </RotatableNodeWrapper>
  )
}

// ============================================================
// Node type registry
// ============================================================

const nodeTypes = {
  redditSource: RedditSourceNode,
  promptRefiner: PromptRefinerNode,
  humanApproval: HumanApprovalNode,
  publisher: PublisherNode,
  hardwareNode: HardwareNode,
  decisionNode: DecisionNode,
}

// ============================================================
// Default node layout
// ============================================================

const defaultNodes = [
  {
    id: '1',
    type: 'redditSource',
    position: { x: 60, y: 180 },
    data: { subreddit: 'MachineLearning', keyword: 'AI automation' },
    deletable: true,
  },
  {
    id: '2',
    type: 'promptRefiner',
    position: { x: 380, y: 140 },
    data: { rawIdea: 'AI automation for Reddit growth hacking' },
    deletable: true,
  },
  {
    id: '3',
    type: 'humanApproval',
    position: { x: 720, y: 160 },
    data: { approved: false },
    deletable: true,
  },
  {
    id: '4',
    type: 'publisher',
    position: { x: 1020, y: 150 },
    data: { subreddit: 'SideProject' },
    deletable: true,
  },
  {
    id: '5',
    type: 'decisionNode',
    position: { x: 550, y: 350 },
    data: {},
    deletable: true,
  },
]

const defaultEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, deletable: true },
  { id: 'e2-3', source: '2', target: '3', animated: true, deletable: true },
  { id: 'e3-4', source: '3', target: '4', animated: true, deletable: true },
]

// ============================================================
// FlowCanvas — Main export
// ============================================================

const FlowCanvas = ({ onNodeSelect }) => {
  const { editMode, isMovementLocked, isFunctionLocked } = useEditMode()
  const { getNode } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState(() => {
    try {
      const saved = localStorage.getItem('rfn_nodes')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Validate against registry whitelist
        const validNodes = parsed.filter(n => nodeTypes[n.type])
        if (validNodes.length > 0) return validNodes
      }
    } catch (e) {
      console.warn("Storage node parse error", e)
    }
    return defaultNodes
  })
  const [edges, setEdges, onEdgesChange] = useEdgesState(() => {
    try {
      const saved = localStorage.getItem('rfn_edges')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return defaultEdges
  })

  // Enforcer for legacy edges and globally styling decision nodes
  useEffect(() => {
    setEdges((eds) => eds.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const isHardware = sourceNode?.type === 'hardwareNode';
      const isFail = edge.sourceHandle === 'fail' || edge.sourceHandle === 'decision-fail';
      const targetStroke = isHardware ? '#FFD700' : (isFail ? '#FF4D4D' : '#00E5FF');
      
      if (edge.style?.stroke !== targetStroke) {
        return { 
          ...edge, 
          style: { 
            ...edge.style, 
            stroke: targetStroke, 
            strokeWidth: isHardware ? 4 : 2 
          } 
        };
      }
      return edge;
    }));

    setNodes((nds) => nds.map(node => {
      if (node.type === 'decisionNode' && typeof node.data?.passed === 'boolean') {
        const expectedColor = node.data.passed ? '#00FF00' : '#FF0000';
        if (node.style?.stroke !== expectedColor) {
           return {
             ...node,
             style: { 
               ...node.style, 
               stroke: expectedColor,
               borderColor: expectedColor,
               boxShadow: `0 0 15px ${expectedColor}`
             }
           };
        }
      }
      return node;
    }));
  }, [nodes, setEdges, setNodes]);

  useEffect(() => {
    localStorage.setItem('rfn_nodes', JSON.stringify(nodes))
  }, [nodes])

  useEffect(() => {
    localStorage.setItem('rfn_edges', JSON.stringify(edges))
  }, [edges])

  // Undo / Redo system
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])

  const takeSnapshot = useCallback(() => {
    setPast(p => [...p, { nodes, edges }])
    setFuture([])
  }, [nodes, edges])

  const undo = () => {
    if (past.length === 0) return
    const prev = past[past.length - 1]
    setPast(p => p.slice(0, -1))
    setFuture(f => [{ nodes, edges }, ...f])
    setNodes(prev.nodes)
    setEdges(prev.edges)
  }

  const redo = () => {
    if (future.length === 0) return
    const next = future[0]
    setFuture(f => f.slice(1))
    setPast(p => [...p, { nodes, edges }])
    setNodes(next.nodes)
    setEdges(next.edges)
  }

  // Edge interaction context menu
  const [edgeMenu, setEdgeMenu] = useState(null)
  
  const onEdgeClick = useCallback((e, edge) => {
    try {
      if (!edge || typeof edge !== 'object') return
      e.stopPropagation()
      setEdgeMenu({
        edgeId: edge.id,
        source: edge.source,
        target: edge.target,
        x: e.clientX,
        y: e.clientY
      })
    } catch (err) {
      console.warn("DOM Crash Prevented [onEdgeClick]:", err)
    }
  }, [])

  const recolorEdgeMenu = (color) => {
    if (!edgeMenu) return
    takeSnapshot()
    setEdges(eds => eds.map(e => e.id === edgeMenu.edgeId ? { ...e, style: { stroke: color, strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color } } : e))
    setEdgeMenu(null)
  }

  // Node Context Menu
  const [nodeMenu, setNodeMenu] = useState(null)
  
  const onNodeContextMenu = useCallback((e, node) => {
    e.preventDefault()
    e.stopPropagation()
    setNodeMenu({
      nodeId: node.id,
      x: e.clientX,
      y: e.clientY
    })
  }, [])

  const deleteNodeMenu = () => {
    if (!nodeMenu) return
    takeSnapshot()
    setNodes(nds => nds.filter(n => n.id !== nodeMenu.nodeId))
    setNodeMenu(null)
  }

  const onPaneClick = useCallback(() => {
    setEdgeMenu(null)
    setNodeMenu(null)
  }, [])

  const deleteEdgeMenu = useCallback((event, edge) => {
    if (event) event.preventDefault()
    if (edge && edge.id) {
       setEdges((es) => es.filter((e) => e.id !== edge.id))
    }
  }, [setEdges])

  const duplicateEdgeMenu = useCallback((event) => {
    if (event) event.preventDefault()
    if (edgeMenu) {
       setEdges((es) => {
         const existing = es.find(e => e.id === edgeMenu.edgeId);
         if (!existing) return es;
         // Generate slightly offset target for demonstration or rely on re-drag
         return [...es, { ...existing, id: `edge_${Date.now()}` }];
       })
       setEdgeMenu(null)
    }
  }, [edgeMenu, setEdges])

  const onConnect = useCallback((params) => {
    const sourceNode = getNode(params.source);
    const isHardware = sourceNode?.type === 'hardwareNode';
    const isFail = params.sourceHandle === 'fail';

    const edgeStyle = {
      stroke: isHardware ? '#FFD700' : (isFail ? '#FF4D4D' : '#00E5FF'),
      strokeWidth: isHardware ? 4 : 2,
    };

    setEdges((eds) => addEdge({ 
      ...params, 
      type: 'smoothstep',
      animated: true, 
      style: edgeStyle 
    }, eds));
  }, [getNode, setEdges]);

  const onNodeClick = useCallback((_, node) => {
    onNodeSelect?.(node)
  }, [onNodeSelect])

  const onDrop = useCallback((event) => {
    event.preventDefault()
    const type = event.dataTransfer.getData('application/rfn-node')
    if (!type) return
    const reactFlowBounds = event.currentTarget.getBoundingClientRect()
    const position = {
      x: event.clientX - reactFlowBounds.left - 120,
      y: event.clientY - reactFlowBounds.top - 50,
    }
    const newNode = {
      id: `${type}_${Date.now()}`,
      type,
      position,
      data: { label: type },
      deletable: true,
    }
    takeSnapshot()
    setNodes(nds => [...nds, newNode])
  }, [setNodes, takeSnapshot])

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  return (
    <div className="w-full h-full rfn-canvas-grid rfn-scanline">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onNodeDragStop={() => takeSnapshot()}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView={true}
        nodesConnectable={!isMovementLocked}
        nodesDraggable={!isMovementLocked}
        onNodesDelete={(deleted) => {
          takeSnapshot()
        }}
        onEdgesDelete={(deleted) => {
          takeSnapshot()
        }}
        snapToGrid={true}
        snapGrid={[10, 10]}
        connectionMode="loose"
        connectionLineType="smoothstep"
        connectionLineStyle={{ stroke: '#00E5FF', strokeWidth: 2 }}
        deleteKeyCode={isMovementLocked ? null : ["Backspace", "Delete"]}
        selectionKeyCode={["Shift"]}
        isValidConnection={() => true}
        connectionRadius={30}
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{ 
          type: 'smoothstep', 
          animated: true, 
          style: { stroke: '#00f5ff', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#00f5ff' }
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant="dots"
          gap={24}
          size={1}
          color="rgba(0,245,255,0.08)"
        />
        <DraggablePanel id="canvas_controls" defaultPos={{ x: 20, y: 400 }} disabled={!editMode || isMovementLocked} editModeContext={editMode}>
          <Controls className="!bg-dark-800 !border-neon-cyan/20" position="top-left" style={{ position: 'relative', margin: 0, transform: 'none', left: 0, top: 0, bottom: 'auto', right: 'auto' }} />
        </DraggablePanel>
        
        <DraggablePanel id="minimap-panel" defaultPos={{ x: 20, y: 500 }} disabled={!editMode || isMovementLocked} editModeContext={editMode}>
          <MiniMap
            position="top-left"
            style={{ position: 'relative', margin: 0, width: 200, height: 150, transform: 'none', left: 0, top: 0, bottom: 'auto', right: 'auto' }}
            nodeColor={(n) => {
              switch (n.type) {
                case 'redditSource': return '#ff6b00'
                case 'promptRefiner': return '#00f5ff'
                case 'humanApproval': return '#bf00ff'
                case 'publisher': return '#39ff14'
                case 'hardwareNode': return '#ff0044'
                default: return '#444'
              }
            }}
            maskColor="rgba(5,8,16,0.8)"
          />
        </DraggablePanel>

        <DraggablePanel id="canvas-mode-toggle" defaultPos={{ x: 800, y: 20 }} disabled={!editMode || isMovementLocked} editModeContext={editMode}>
          <div className="flex items-center gap-2 text-xs font-mono bg-dark-800/90
                          border border-neon-cyan/20 rounded-lg px-3 py-1.5 shadow-[0_0_15px_rgba(0,245,255,0.2)]">
            <span className="text-gray-500">CANVAS MODE</span>
            <span className="text-neon-cyan text-glow-cyan">ACTIVE</span>
          </div>
        </DraggablePanel>
        
        <DraggablePanel id="undo-redo-panel" defaultPos={{ x: 60, y: 20 }} disabled={!editMode || isMovementLocked} editModeContext={editMode}>
          <div className="flex gap-2">
            <button 
              onClick={undo} disabled={past.length === 0}
              className="px-3 py-1.5 rounded bg-dark-900 border border-neon-cyan/30 text-neon-cyan text-[10px] font-mono tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neon-cyan/20 transition-all">
              ⟲ UNDO
            </button>
            <button 
              onClick={redo} disabled={future.length === 0}
              className="px-3 py-1.5 rounded bg-dark-900 border border-neon-cyan/30 text-neon-cyan text-[10px] font-mono tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neon-cyan/20 transition-all">
              REDO ⟳
            </button>
          </div>
        </DraggablePanel>
      </ReactFlow>

      {nodeMenu && typeof nodeMenu.x === 'number' && (
        <div style={{ top: nodeMenu.y, left: nodeMenu.x }} className="fixed z-[9999] bg-dark-900 border border-neon-cyan/50 rounded-lg p-2 shadow-[0_0_15px_rgba(0,245,255,0.2)]">
          <button onClick={deleteNodeMenu} className="block w-full text-left px-3 py-1.5 text-xs font-mono text-red-400 hover:bg-red-500/20 rounded">✗ Eliminar Nodo</button>
        </div>
      )}

      {edgeMenu && typeof edgeMenu.x === 'number' && (
        <div style={{ top: edgeMenu.y, left: edgeMenu.x }} className="fixed z-[9999] bg-dark-900 border border-neon-cyan/50 rounded-lg p-2 shadow-[0_0_15px_rgba(0,245,255,0.2)]">
          <button onClick={() => {
            setEdges((es) => es.filter((e) => e.id !== edgeMenu.edgeId));
            setEdgeMenu(null);
          }} className="block w-full text-left px-3 py-1.5 text-xs font-mono text-red-400 hover:bg-red-500/20 rounded">✗ Eliminar Conector</button>
          <button onClick={() => {
            onConnect({ source: edgeMenu.source, target: edgeMenu.target, sourceHandle: null, targetHandle: null });
            setEdgeMenu(null);
          }} className="block w-full text-left px-3 py-1.5 text-xs font-mono text-neon-cyan hover:bg-neon-cyan/20 rounded mt-1">⎘ Duplicar Conexión</button>
          
          {editMode && (
            <div className="mt-2 pt-2 border-t border-gray-700/50 flex gap-2 justify-center">
              {['#00f5ff', '#39ff14', '#bf00ff', '#ff6b00'].map(color => (
                <button 
                  key={color} 
                  onClick={() => recolorEdgeMenu(color)}
                  className="w-4 h-4 rounded-full border border-gray-600 hover:scale-125 transition-transform shadow-lg" 
                  style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}` }} 
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FlowCanvas
