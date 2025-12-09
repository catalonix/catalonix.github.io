import React, { useState, useRef, useEffect } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { 
  LayoutDashboard, Map, Sprout, ClipboardList, BookOpen, 
  Bell, User, Droplets, Thermometer, Wind, 
  AlertTriangle, CheckCircle, Menu, ChevronRight, ArrowUpRight, Layers, 
  MessageSquare, Send, Search, Target
} from 'lucide-react';
import './index.css'

// --- 1. Mock Data (데이터 모델) ---

// 대시보드용 육각형 지표 (TQI)
const hexData = [
  { subject: '구조적 활력', A: 88, fullMark: 100 },
  { subject: '수분 밸런스', A: 65, fullMark: 100 },
  { subject: '염류 스트레스', A: 92, fullMark: 100 },
  { subject: '열 스트레스', A: 75, fullMark: 100 },
  { subject: '경기력', A: 95, fullMark: 100 },
  { subject: '회복 잠재력', A: 82, fullMark: 100 },
];

// 전체 코스 상태 데이터 (18홀)
const courseStatusData = Array.from({ length: 18 }, (_, i) => ({
  hole: i + 1,
  par: [4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4][i],
  ndvi: (0.7 + Math.random() * 0.2).toFixed(2),
  moisture: (18 + Math.random() * 15).toFixed(1),
  status: i === 3 ? 'Critical' : i === 6 ? 'Warning' : 'Stable', // 4번홀 위험, 7번홀 경고
  issue: i === 3 ? '라지패치 위험' : i === 6 ? '페어웨이 수분 부족' : '-'
}));

// AI 챗봇 시나리오 데이터
const aiChatScenarios = {
  default: "안녕하세요. GDX AI Analyst입니다. 위성 및 센서 데이터를 기반으로 코스 상태를 분석 중입니다.",
  stress: "데이터 분석 결과, 현재 수분 스트레스가 가장 심한 곳은 **7번 홀 페어웨이 (VWC 12%)** 입니다. 국소 관수(Spot Watering) 5분을 추천합니다.",
  disease: "**4번 홀 그린**에서 라지패치 발병 확률이 **85%**로 분석되었습니다. 오늘 오후 강우가 예상되므로, 오전 중 예방 시약 살포가 시급합니다.",
  overview: "현재 전체 18홀 중 16개 홀은 **안정적**이나, **4번(병해)**과 **7번(건조)** 홀에서 집중 관리가 필요합니다."
};

// AI 예측 데이터 (DML 모델)
const predictionData = [
  { day: 'D-3', actual: 15, predicted: 18, threshold: 40 },
  { day: 'D-2', actual: 22, predicted: 25, threshold: 40 },
  { day: 'D-1', actual: 35, predicted: 38, threshold: 40 },
  { day: 'Today', actual: 42, predicted: 45, threshold: 40 }, // 오늘 임계치 초과
  { day: 'D+1', actual: null, predicted: 55, threshold: 40 },
  { day: 'D+2', actual: null, predicted: 68, threshold: 40 },
  { day: 'D+3', actual: null, predicted: 75, threshold: 40 },
];

// 작업 지시 데이터
const taskData = [
  { id: 'T-204', type: 'Chemical', area: 'Hole 4 Green', desc: '라지패치 예방 시약 살포 (Azoxystrobin)', status: 'Pending', assignee: '김관리', priority: 'High' },
  { id: 'T-205', type: 'Irrigation', area: 'Hole 7 Fairway', desc: '국소 건조반 스팟 관수 (5분)', status: 'In Progress', assignee: '이작업', priority: 'Medium' },
  { id: 'T-206', type: 'Cultural', area: 'Hole 9 Tee', desc: '티 마커 이동 및 디봇 보수', status: 'Done', assignee: '박보수', priority: 'Low' },
];

// --- 2. Shared UI Components ---

const StatusBadge = ({ status }) => {
  const styles = {
    Critical: 'bg-red-500/20 text-red-400 border-red-500/50',
    Warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    Stable: 'bg-green-500/20 text-green-400 border-green-500/50',
    Pending: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
    'In Progress': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    Done: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs border whitespace-nowrap ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
};

// --- 3. View Components (Tabs) ---

// [View 1] 통합 대시보드
const DashboardView = ({ setActiveTab }) => (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 h-full overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
    {/* KPI Cards */}
    <div className="col-span-1 md:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-xs">종합 생육 지수 (TQI)</p>
            <h3 className="text-2xl font-bold text-white mt-1">82.5 <span className="text-sm font-normal text-green-400">Stable</span></h3>
          </div>
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Sprout size={20}/></div>
        </div>
        <div className="mt-3 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 w-[82%]"></div>
        </div>
      </div>
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-xs">평균 그린 스피드</p>
            <h3 className="text-2xl font-bold text-white mt-1">3.2m <span className="text-sm font-normal text-slate-400">(Fast)</span></h3>
          </div>
          <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Wind size={20}/></div>
        </div>
        <p className="text-xs text-slate-500 mt-3">Target: 3.0m ~ 3.3m</p>
      </div>
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-xs">긴급 경보 (Critical)</p>
            <h3 className="text-2xl font-bold text-red-400 mt-1">1건 <span className="text-sm font-normal text-slate-400">/ 18홀</span></h3>
          </div>
          <div className="p-2 bg-red-500/20 rounded-lg text-red-400"><AlertTriangle size={20}/></div>
        </div>
        <p className="text-xs text-red-300 mt-3 cursor-pointer hover:underline" onClick={() => setActiveTab('detail')}>Hole 4: 라지패치 위험 &rarr;</p>
      </div>
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-xs">작업 진행률</p>
            <h3 className="text-2xl font-bold text-white mt-1">45% <span className="text-sm font-normal text-slate-400">(9/20)</span></h3>
          </div>
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><ClipboardList size={20}/></div>
        </div>
        <div className="mt-3 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 w-[45%]"></div>
        </div>
      </div>
    </div>

    {/* Hex Chart */}
    <div className="col-span-1 md:col-span-12 lg:col-span-8 bg-slate-800 rounded-xl border border-slate-700 p-4">
      <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
        <Layers size={16} /> GDX 육각형 인덱스 (Total Course Average)
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={hexData}>
            <PolarGrid stroke="#475569" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="GDX Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
            <RechartsTooltip contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155'}} itemStyle={{color: '#fff'}} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Real-time Alerts */}
    <div className="col-span-1 md:col-span-12 lg:col-span-4 bg-slate-800 rounded-xl border border-slate-700 p-4">
      <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
        <Bell size={16} /> 실시간 AI 알림
      </h3>
      <div className="space-y-3">
        <div className="p-3 bg-red-500/10 border-l-4 border-red-500 rounded-r-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-red-400">CRITICAL</span>
            <span className="text-[10px] text-slate-500">10분 전</span>
          </div>
          <p className="text-sm text-slate-200">Hole 4 Green: 라지패치 발병 확률 85% 초과</p>
        </div>
        <div className="p-3 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-r-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-yellow-500">WARNING</span>
            <span className="text-[10px] text-slate-500">30분 전</span>
          </div>
          <p className="text-sm text-slate-200">Hole 7 Fairway: 수분 스트레스 (VWC &lt; 15%)</p>
        </div>
        <div className="p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-blue-400">INFO</span>
            <span className="text-[10px] text-slate-500">1시간 전</span>
          </div>
          <p className="text-sm text-slate-200">CatSat™ 위성 이미지 업데이트 완료</p>
        </div>
      </div>
    </div>
  </div>
);

// [View 2] 전체 코스 관제 및 AI 조망 (Updated)
const CourseView = ({ setSelectedHole, setActiveTab, setAreaType }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: aiChatScenarios.default }
  ]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // User Message
    const newMessages = [...messages, { role: 'user', text: inputText }];
    setMessages(newMessages);
    setInputText('');

    // AI Response Simulation
    let response = "죄송합니다. 현재 분석 중인 데이터가 부족합니다.";
    if (inputText.includes("수분") || inputText.includes("건조")) response = aiChatScenarios.stress;
    else if (inputText.includes("병") || inputText.includes("라지패치")) response = aiChatScenarios.disease;
    else if (inputText.includes("상태") || inputText.includes("전체")) response = aiChatScenarios.overview;

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    }, 800);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="p-4 md:p-6 h-full flex flex-col lg:flex-row gap-4 md:gap-6 pb-24 md:pb-6 overflow-y-auto">
      {/* Left: 18-Hole Visual Map */}
      <div className="flex-1 flex flex-col min-h-[400px]">
        <h2 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Map size={20} /> 18-Hole Course Overview
        </h2>
        <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] min-h-[300px]">
          {/* Schematic Course Map (SVG) */}
          <svg viewBox="0 0 800 600" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            {/* Simple winding path for the course */}
            <path d="M100,500 Q150,400 200,450 T300,400 T400,300 T500,350 T600,200 T700,100" 
              fill="none" stroke="#334155" strokeWidth="4" strokeDasharray="5 5"
            />
            
            {/* Holes Nodes */}
            {courseStatusData.map((hole, i) => {
               // Generate simple positions along a curve
               const x = 100 + (i % 5) * 140 + (Math.floor(i/5)%2 * 50);
               const y = 500 - (Math.floor(i / 5) * 120) - (i % 5 * 20);
               
               let color = "#4ade80"; // Stable
               if (hole.status === 'Critical') color = "#ef4444";
               if (hole.status === 'Warning') color = "#facc15";

               return (
                 <g key={hole.hole} 
                    onClick={() => { 
                      setSelectedHole(hole.hole); 
                      // 7번홀 클릭 시 자동으로 페어웨이 뷰로 전환하는 시나리오
                      if(hole.hole === 7) setAreaType('Fairway');
                      else setAreaType('Green');
                      setActiveTab('detail'); 
                    }}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                 >
                   <circle cx={x} cy={y} r="25" fill="#1e293b" stroke={color} strokeWidth={hole.status === 'Stable' ? 2 : 4} />
                   <text x={x} y={y} dy="5" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{hole.hole}</text>
                   
                   {/* Tooltip on Hover Group (Simplified for demo as static text) */}
                   {hole.status !== 'Stable' && (
                     <g>
                       <rect x={x - 40} y={y - 50} width="80" height="20" rx="4" fill={color} />
                       <text x={x} y={y - 36} textAnchor="middle" fill="black" fontSize="10" fontWeight="bold">{hole.issue.split(' ')[0]}</text>
                     </g>
                   )}
                 </g>
               );
            })}
          </svg>
          <div className="absolute bottom-4 right-4 bg-slate-900/80 p-2 md:p-3 rounded-lg border border-slate-600 text-[10px] md:text-xs text-slate-300">
            <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500"></span> Stable</div>
            <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500 border border-yellow-200"></span> Warning</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500 border border-red-200 animate-pulse"></span> Critical</div>
          </div>
        </div>
      </div>

      {/* Right: AI Chat Interface */}
      <div className="w-full lg:w-96 flex flex-col bg-slate-800 rounded-xl border border-slate-700 shadow-xl h-[400px] lg:h-auto">
        <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-t-xl">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
            <MessageSquare size={18} className="text-blue-400"/> GDX AI Analyst
          </h3>
          <p className="text-[10px] md:text-xs text-slate-400 mt-1">DML 모델 기반 실시간 데이터 분석</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-slate-700 text-slate-200 rounded-bl-none border border-slate-600'
              }`}>
                {msg.text.split('**').map((part, i) => 
                  i % 2 === 1 ? <span key={i} className="font-bold text-yellow-300">{part}</span> : part
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-slate-700">
          <div className="relative">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="질문을 입력하세요..."
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500"
            />
            <button 
              onClick={handleSendMessage}
              className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['수분 상태 요약', '위험 지역?', '코스 브리핑'].map(suggestion => (
              <button 
                key={suggestion}
                onClick={() => { setInputText(suggestion); handleSendMessage(); }}
                className="whitespace-nowrap px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 rounded-full border border-slate-600 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// [View 3] 홀 상세 정밀 분석 (Green, Fairway, Tee)
const HoleDetailView = ({ selectedHole, activeLayer, setActiveLayer, areaType, setAreaType }) => {
  const getAreaLabel = () => {
    switch(areaType) {
      case 'Fairway': return 'Fairway';
      case 'Tee': return 'Teeing Ground';
      default: return 'Green';
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto pb-24 md:pb-6">
      {/* Header with Area Toggles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white flex flex-wrap items-center gap-2">
            Hole {selectedHole} {getAreaLabel()}
            {selectedHole === 4 && areaType === 'Green' && <span className="text-xs font-normal text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20 whitespace-nowrap">Critical Alert</span>}
            {selectedHole === 7 && areaType === 'Fairway' && <span className="text-xs font-normal text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20 whitespace-nowrap">Drought Warning</span>}
          </h2>
          <div className="flex gap-1 mt-2 bg-slate-800 p-1 rounded-lg border border-slate-700 w-fit overflow-x-auto">
            {['Green', 'Fairway', 'Tee'].map((type) => (
              <button
                key={type}
                onClick={() => setAreaType(type)}
                className={`px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                  areaType === type 
                    ? 'bg-slate-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'satellite', label: '🛰️ 위성', color: 'bg-green-600' },
            { id: 'moisture', label: '💧 수분', color: 'bg-blue-600' },
            { id: 'deacon', label: '⛳ 경기력', color: 'bg-purple-600' }
          ].map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded transition-all whitespace-nowrap ${
                activeLayer === layer.id ? `${layer.color} text-white shadow-lg` : 'text-slate-400 hover:text-white'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-0">
        {/* Interactive SVG Map */}
        <div className="col-span-12 lg:col-span-8 bg-slate-900 rounded-xl border border-slate-700 relative overflow-hidden flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] h-64 md:h-auto min-h-[300px]">
          
          {/* Legend Overlay */}
          <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur p-2 md:p-3 rounded-lg border border-slate-600 shadow-xl z-10">
            <h4 className="text-[10px] md:text-xs font-bold text-slate-300 mb-2">
              {activeLayer === 'satellite' ? 'CatSat™ 초해상화' : activeLayer === 'moisture' ? '수분 히트맵 (Co-Kriging)' : 'Deacon™ 경기력'}
            </h4>
            {activeLayer === 'moisture' && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] text-slate-400"><div className="w-3 h-3 bg-blue-600 rounded"></div> 과습 ({'>'}40%)</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400"><div className="w-3 h-3 bg-orange-400 rounded"></div> 건조 (&lt;15%)</div>
              </div>
            )}
            {activeLayer === 'deacon' && areaType === 'Green' && (
               <div className="flex items-center gap-2 text-[10px] text-slate-400"><div className="w-3 h-3 border border-red-500 bg-red-500/20 rounded"></div> 핀 설치 금지 (Red Zone)</div>
            )}
            {activeLayer === 'deacon' && (areaType === 'Fairway' || areaType === 'Tee') && (
               <div className="flex items-center gap-2 text-[10px] text-slate-400"><div className="w-3 h-3 bg-purple-500/50 rounded"></div> 고답압 지역 (Traffic)</div>
            )}
          </div>

          {/* Dynamic SVG Visualizer based on Area Type */}
          <svg viewBox="0 0 500 400" className="w-full h-full max-h-[500px] drop-shadow-2xl transition-all duration-700" preserveAspectRatio="xMidYMid meet">
             <defs>
               <filter id="blurFilter"><feGaussianBlur stdDeviation="10" /></filter>
               <pattern id="grass" width="20" height="20" patternUnits="userSpaceOnUse">
                 <rect width="20" height="20" fill={activeLayer === 'satellite' ? '#14532d' : '#0f172a'} />
                 <path d="M0 20 L20 0" stroke={activeLayer === 'satellite' ? '#166534' : '#1e293b'} strokeWidth="1"/>
               </pattern>
             </defs>
             
             {/* 1. GREEN SHAPE */}
             {areaType === 'Green' && (
               <>
                 <path d="M100,200 C100,100 200,50 300,80 C400,110 450,200 400,300 C350,380 150,350 100,200 Z" 
                   fill="url(#grass)" stroke="#22c55e" strokeWidth="2"
                 />
                 {activeLayer === 'moisture' && (
                   <g className="animate-fade-in opacity-80" style={{mixBlendMode: 'screen'}}>
                     <circle cx="200" cy="200" r="80" fill="#3b82f6" filter="url(#blurFilter)" opacity="0.6" />
                     {selectedHole === 4 && <circle cx="350" cy="250" r="60" fill="#f97316" filter="url(#blurFilter)" opacity="0.7" />}
                   </g>
                 )}
                 {activeLayer === 'satellite' && selectedHole === 4 && (
                   <g>
                     <circle cx="350" cy="250" r="40" fill="transparent" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" className="animate-ping-slow" />
                     <text x="350" y="310" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">LST Hotspot</text>
                   </g>
                 )}
                 {activeLayer === 'deacon' && (
                   <g>
                     <path d="M300,80 C350,95 380,120 370,150 L340,140 Z" fill="#ef4444" fillOpacity="0.4" stroke="#ef4444" />
                     <text x="350" y="120" textAnchor="middle" fill="#fca5a5" fontSize="10">NO PIN</text>
                     <g transform="translate(200, 200)">
                        <circle cx="0" cy="0" r="4" fill="#1e293b" stroke="#fbbf24" strokeWidth="2"/>
                        <line x1="0" y1="0" x2="0" y2="-50" stroke="#fbbf24" strokeWidth="3"/>
                        <polygon points="0,-50 30,-40 0,-30" fill="#ef4444"/>
                     </g>
                   </g>
                 )}
               </>
             )}

             {/* 2. FAIRWAY SHAPE */}
             {areaType === 'Fairway' && (
                <>
                  <path d="M50,300 C80,350 150,380 250,350 C350,320 450,300 480,150 C500,50 400,20 300,50 C200,80 100,100 50,300 Z"
                    fill="url(#grass)" stroke="#22c55e" strokeWidth="2"
                  />
                  {activeLayer === 'moisture' && (
                    <g style={{mixBlendMode: 'screen'}}>
                       {/* Dry Spots on Fairway (Hole 7) */}
                       <ellipse cx="250" cy="200" rx="100" ry="50" fill={selectedHole === 7 ? "#f97316" : "#3b82f6"} filter="url(#blurFilter)" opacity="0.5" />
                    </g>
                  )}
                   {activeLayer === 'deacon' && (
                    <g>
                       <path d="M150,300 Q250,320 350,200" stroke="#a855f7" strokeWidth="20" strokeOpacity="0.3" fill="none" filter="url(#blurFilter)"/>
                       <text x="250" y="320" textAnchor="middle" fill="#d8b4fe" fontSize="12">High Traffic</text>
                    </g>
                  )}
                </>
             )}

             {/* 3. TEE SHAPE */}
             {areaType === 'Tee' && (
                <>
                  <rect x="150" y="150" width="200" height="100" rx="20" fill="url(#grass)" stroke="#22c55e" strokeWidth="2" />
                  <circle cx="180" cy="200" r="5" fill="#f8fafc" stroke="#64748b" /> {/* Tee Marker L */}
                  <circle cx="320" cy="200" r="5" fill="#f8fafc" stroke="#64748b" /> {/* Tee Marker R */}
                  
                  {activeLayer === 'deacon' && (
                    <rect x="200" y="180" width="100" height="40" fill="#a855f7" fillOpacity="0.4" filter="url(#blurFilter)" />
                  )}
                  {activeLayer === 'satellite' && (
                     <text x="250" y="270" textAnchor="middle" fill="#94a3b8" fontSize="12">Divot Density: Low</text>
                  )}
                </>
             )}
          </svg>
        </div>

        {/* Right Side Analysis Panel */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-1">
             <h3 className="text-sm font-bold text-slate-200 mb-3">{getAreaLabel()} 정밀 분석</h3>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-xs text-slate-400 mb-1">
                   <span>평균 수분 (VWC)</span>
                   <span className={areaType === 'Fairway' && selectedHole === 7 ? 'text-yellow-400' : 'text-green-400'}>
                     {areaType === 'Fairway' && selectedHole === 7 ? '12% (Dry)' : '24% (Optimal)'}
                   </span>
                 </div>
                 <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full ${areaType === 'Fairway' && selectedHole === 7 ? 'bg-yellow-500 w-[12%]' : 'bg-blue-500 w-[24%]'}`}></div>
                 </div>
               </div>
               <div>
                 <div className="flex justify-between text-xs text-slate-400 mb-1">
                   <span>염류 지수 (Salinity)</span>
                   <span className="text-white">0.8 dS/m</span>
                 </div>
                 <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-[15%]"></div>
                 </div>
               </div>
               {areaType === 'Green' && (
                 <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mt-4">
                    <h4 className="text-xs font-bold text-red-300 flex items-center gap-1"><AlertTriangle size={12}/> AI 진단 (CatSat)</h4>
                    <p className="text-[10px] text-red-200 mt-1">
                      라지패치 발병 확률이 높습니다. 4번 홀 그린 우측 상단 핫스팟 집중 관찰 필요.
                    </p>
                 </div>
               )}
                {areaType === 'Fairway' && selectedHole === 7 && (
                 <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mt-4">
                    <h4 className="text-xs font-bold text-yellow-300 flex items-center gap-1"><Droplets size={12}/> AI 진단 (POGO)</h4>
                    <p className="text-[10px] text-yellow-200 mt-1">
                      중앙 페어웨이 수분 스트레스 감지. 스팟 관수 5분 추천.
                    </p>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// [View 4] AI 예측 및 매뉴얼
const PredictionView = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 h-full overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
    <div className="col-span-1 lg:col-span-2 bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-700">
      <h2 className="text-base md:text-lg font-bold text-white mb-1 flex items-center gap-2">
        <ArrowUpRight size={20} className="text-purple-400"/> DML 병해 예측 모델 (Disease Forecast)
      </h2>
      <p className="text-xs text-slate-400 mb-6">대상: 라지패치 (Rhizoctonia solani) | Hole 4 Green 기준</p>
      
      <div className="h-48 md:h-64 w-full">
         <ResponsiveContainer width="100%" height="100%">
           <AreaChart data={predictionData}>
             <defs>
               <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                 <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
               </linearGradient>
             </defs>
             <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
             <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
             <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
             <RechartsTooltip contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155'}} />
             <Area type="monotone" dataKey="predicted" stroke="#ef4444" fillOpacity={1} fill="url(#colorPred)" name="발병 확률 (AI 예측)" />
             <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="실제 위험도 (센서)" />
             <Line type="monotone" dataKey="threshold" stroke="#fbbf24" strokeDasharray="5 5" name="경보 임계값 (40%)" />
           </AreaChart>
         </ResponsiveContainer>
      </div>
      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-200">
         <strong>AI 분석:</strong> 향후 3일간 고온다습 기후 지속으로 발병 확률 급증(75%). D+1일 이내 예방 시약 살포 권장.
      </div>
    </div>

    <div className="col-span-1 lg:col-span-2 bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-700">
       <h2 className="text-base md:text-lg font-bold text-white mb-4 flex items-center gap-2">
        <BookOpen size={20} className="text-blue-400"/> 관리 매뉴얼 (Action Protocol)
      </h2>
      <div className="space-y-4">
         <div className="border border-slate-600 rounded-lg overflow-hidden">
           <div className="bg-slate-700 p-3 flex justify-between items-center cursor-pointer">
             <span className="font-bold text-white text-sm md:text-base">라지패치 (Large Patch) 대응 매뉴얼</span>
             <ChevronRight size={16} className="text-slate-400" />
           </div>
           <div className="p-4 bg-slate-800 text-sm text-slate-300 space-y-2">
              <p><strong>1. 환경 제어:</strong> 대취(Thatch) 제거 및 배수 불량지 갱신.</p>
              <p><strong>2. 시비 전략:</strong> 발병기(봄/가을) 질소 중단. 규산(Si) 시비.</p>
              <p><strong>3. 약제 처방:</strong></p>
              <ul className="list-disc list-inside pl-4 text-slate-400">
                <li>예방: Azoxystrobin (FRAC 11) 또는 Tebuconazole (FRAC 3)</li>
                <li>치료: Pencycuron, Flutolanil 관주 처리 (2L/㎡ 이상)</li>
              </ul>
           </div>
         </div>
      </div>
    </div>
  </div>
);

// [View 5] 작업 관리
const TaskView = () => (
  <div className="p-4 md:p-6 h-full flex flex-col pb-24 md:pb-6">
    <div className="flex justify-between items-end mb-6">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
          <ClipboardList size={20} /> 작업 관리 및 배분
        </h2>
        <p className="text-xs md:text-sm text-slate-400 mt-1">AI 생성 작업 지시서 관리</p>
      </div>
      <button className="bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap">
        + 새 작업
      </button>
    </div>

    <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-700/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4">ID</th>
              <th className="p-4">유형</th>
              <th className="p-4">대상 구역</th>
              <th className="p-4">작업 내용</th>
              <th className="p-4">담당자</th>
              <th className="p-4">우선순위</th>
              <th className="p-4">상태</th>
              <th className="p-4">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {taskData.map((task) => (
              <tr key={task.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="p-4 text-sm font-mono text-slate-400">{task.id}</td>
                <td className="p-4 text-sm text-white">{task.type}</td>
                <td className="p-4 text-sm text-slate-300">{task.area}</td>
                <td className="p-4 text-sm text-white font-medium">{task.desc}</td>
                <td className="p-4 text-sm text-slate-300 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-[10px] text-white">
                    {task.assignee[0]}
                  </div>
                  {task.assignee}
                </td>
                <td className="p-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    task.priority === 'High' ? 'text-red-400 bg-red-400/10' : 
                    task.priority === 'Medium' ? 'text-yellow-400 bg-yellow-400/10' : 
                    'text-blue-400 bg-blue-400/10'
                  }`}>{task.priority}</span>
                </td>
                <td className="p-4"><StatusBadge status={task.status} /></td>
                <td className="p-4">
                  <button className="text-slate-400 hover:text-white p-1 hover:bg-slate-600 rounded">
                    <Menu size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// --- 4. Main App Layout ---

const GDXApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeLayer, setActiveLayer] = useState('satellite'); 
  const [selectedHole, setSelectedHole] = useState(4); 
  const [areaType, setAreaType] = useState('Green'); // Green, Fairway, Tee

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      {/* Sidebar (Desktop Only) */}
      <aside className="hidden md:flex w-64 bg-slate-800 border-r border-slate-700 flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">G</div>
          <div>
            <h1 className="font-bold text-lg tracking-wide">GDX Platform</h1>
            <p className="text-[10px] text-slate-400">Integrated Command Center</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 py-4 px-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: '통합 대시보드' },
            { id: 'course', icon: Map, label: '전체 코스 관제' },
            { id: 'detail', icon: Target, label: '홀별 정밀 분석' },
            { id: 'prediction', icon: BookOpen, label: 'AI 예측 및 매뉴얼' },
            { id: 'tasks', icon: ClipboardList, label: '작업 관리' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center"><User size={16}/></div>
            <div>
              <p className="text-xs font-bold">박현장 슈퍼인텐던트</p>
              <p className="text-[10px] text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between px-4 md:px-6 backdrop-blur-sm sticky top-0 z-20">
          <h2 className="font-bold text-slate-200 text-sm md:text-base truncate">
            {activeTab === 'dashboard' && 'Integrated Dashboard'}
            {activeTab === 'detail' && 'Hole Detail Analysis'}
            {activeTab === 'course' && 'Course Overview & AI'}
            {activeTab === 'prediction' && 'AI Prediction'}
            {activeTab === 'tasks' && 'Work Order Management'}
          </h2>
          <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-slate-400">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-600">
               <Thermometer size={14} className="text-orange-400"/> <span>28.5°C</span>
               <span className="w-px h-3 bg-slate-600 mx-1"></span>
               <Droplets size={14} className="text-blue-400"/> <span>65%</span>
            </div>
            <div className="relative">
              <Bell size={20} className="hover:text-white cursor-pointer"/>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-800"></span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
          {activeTab === 'detail' && (
            <HoleDetailView 
              selectedHole={selectedHole} 
              activeLayer={activeLayer} 
              setActiveLayer={setActiveLayer}
              areaType={areaType}
              setAreaType={setAreaType}
            />
          )}
          {activeTab === 'course' && <CourseView setSelectedHole={setSelectedHole} setActiveTab={setActiveTab} setAreaType={setAreaType} />}
          {activeTab === 'prediction' && <PredictionView />}
          {activeTab === 'tasks' && <TaskView />}
        </div>

        {/* Mobile Navigation Bar (Bottom) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 pb-safe z-50 px-4 py-2 flex justify-between items-center">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: '대시보드' },
            { id: 'course', icon: Map, label: '코스 관제' },
            { id: 'detail', icon: Target, label: '정밀분석' },
            { id: 'prediction', icon: BookOpen, label: 'AI 예측' },
            { id: 'tasks', icon: ClipboardList, label: '작업' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-1 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'text-blue-500' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default GDXApp;