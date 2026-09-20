import React, { useState } from 'react';
import { RotateCw, Eye, Sparkles, Activity, ShieldAlert, Check } from 'lucide-react';
import { TONUS_STATES, SENSORY_STATES, ANATOMICAL_ZONES } from './PsychomotorData';

export default function InteractiveBodyMapSvg({
  bodyMapState = {},
  selectedZoneId = null,
  onSelectZone,
  activeView = 'anterior', // 'anterior' | 'posterior'
  onChangeView,
  readOnly = false,
}) {
  const [hoveredZoneId, setHoveredZoneId] = useState(null);

  // Helper to get fill and stroke colors for a zone
  const getZoneStyle = (zoneId) => {
    const data = bodyMapState[zoneId];
    const isSelected = selectedZoneId === zoneId;
    const isHovered = hoveredZoneId === zoneId;

    let fill = '#1e293b'; // Default sleek dark slate
    let stroke = '#475569';
    let strokeWidth = isSelected ? 2.5 : isHovered ? 2 : 1;
    let filter = isSelected ? 'url(#glow-selected)' : 'none';

    if (data) {
      if (data.tonus && TONUS_STATES[data.tonus]) {
        fill = TONUS_STATES[data.tonus].fillColor;
        stroke = TONUS_STATES[data.tonus].color;
      }
      if (data.sensory && data.sensory !== 'normosensible') {
        // Add sensory highlight border
        if (data.sensory === 'hypersensible') {
          stroke = '#f43f5e';
          strokeWidth = Math.max(strokeWidth, 2);
        } else if (data.sensory === 'hyposensible') {
          stroke = '#10b981';
          strokeWidth = Math.max(strokeWidth, 2);
        }
      }
    }

    if (isSelected) {
      stroke = '#38bdf8'; // Sky-400 for focused active zone
      strokeWidth = 3;
    }

    return { fill, stroke, strokeWidth, filter };
  };

  const currentHoveredZone = ANATOMICAL_ZONES.find((z) => z.id === (hoveredZoneId || selectedZoneId));

  return (
    <div className="flex flex-col items-center justify-between p-4 rounded-3xl bg-slate-950/80 border border-slate-800 relative select-none shadow-xl">
      {/* Top Header & View Toggle */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-black text-white flex items-center space-x-1.5 space-x-reverse">
              <span>خريطة الجسد التفاعلية (Body Map)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono">
                {activeView === 'anterior' ? 'المنظر الأمامي (Anterior)' : 'المنظر الخلفي (Posterior)'}
              </span>
            </h5>
            <p className="text-[10px] text-slate-400">انقر على أي جزء لتسجيل النغمة العضلية والتحسس اللمسي</p>
          </div>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => onChangeView('anterior')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 space-x-reverse ${
              activeView === 'anterior'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>👤 أمامي</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeView('posterior')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 space-x-reverse ${
              activeView === 'posterior'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-3 h-3" />
            <span>خلفي 🔄</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full max-w-[340px] my-2 flex items-center justify-center">
        <svg
          viewBox="0 0 400 620"
          className="w-full h-auto max-h-[480px] drop-shadow-2xl transition-all"
        >
          <defs>
            <filter id="glow-selected" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="body-bg-radial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ambient Glow Silhouette Silhouette Backdrop */}
          <ellipse cx="200" cy="310" rx="140" ry="260" fill="url(#body-bg-radial)" />

          {/* ========================================================================= */}
          {/* VIEW 1: ANTERIOR (Front View)                                             */}
          {/* ========================================================================= */}
          {activeView === 'anterior' && (
            <g id="anterior-view" className="cursor-pointer">
              {/* Head & Face */}
              <g
                id="head_anterior"
                onClick={() => !readOnly && onSelectZone('head_anterior')}
                onMouseEnter={() => setHoveredZoneId('head_anterior')}
                onMouseLeave={() => setHoveredZoneId(null)}
              >
                <ellipse
                  cx="200"
                  cy="50"
                  rx="26"
                  ry="32"
                  {...getZoneStyle('head_anterior')}
                  className="transition-all duration-200"
                />
                {/* Facial Guides */}
                <ellipse cx="192" cy="48" rx="2" ry="1.5" fill="#94a3b8" />
                <ellipse cx="208" cy="48" rx="2" ry="1.5" fill="#94a3b8" />
                <path d="M198 56 Q200 58 202 56" stroke="#94a3b8" strokeWidth="1" fill="none" />
              </g>

              {/* Neck Anterior */}
              <path
                id="neck_anterior"
                d="M192,80 L208,80 L212,100 L188,100 Z"
                {...getZoneStyle('neck_anterior')}
                onClick={() => !readOnly && onSelectZone('neck_anterior')}
                onMouseEnter={() => setHoveredZoneId('neck_anterior')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Right Shoulder (Left on Screen in anatomical anterior) */}
              <path
                id="shoulder_right"
                d="M188,100 L150,108 L138,135 L170,135 L186,112 Z"
                {...getZoneStyle('shoulder_right')}
                onClick={() => !readOnly && onSelectZone('shoulder_right')}
                onMouseEnter={() => setHoveredZoneId('shoulder_right')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Left Shoulder (Right on Screen) */}
              <path
                id="shoulder_left"
                d="M212,100 L250,108 L262,135 L230,135 L214,112 Z"
                {...getZoneStyle('shoulder_left')}
                onClick={() => !readOnly && onSelectZone('shoulder_left')}
                onMouseEnter={() => setHoveredZoneId('shoulder_left')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Chest (Thorax) */}
              <path
                id="chest"
                d="M170,102 L230,102 L236,170 L164,170 Z"
                {...getZoneStyle('chest')}
                onClick={() => !readOnly && onSelectZone('chest')}
                onMouseEnter={() => setHoveredZoneId('chest')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Abdomen & Core */}
              <path
                id="abdomen"
                d="M164,172 L236,172 L228,240 L172,240 Z"
                {...getZoneStyle('abdomen')}
                onClick={() => !readOnly && onSelectZone('abdomen')}
                onMouseEnter={() => setHoveredZoneId('abdomen')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Pelvis Anterior */}
              <path
                id="pelvis_anterior"
                d="M172,242 L228,242 L220,285 L200,295 L180,285 Z"
                {...getZoneStyle('pelvis_anterior')}
                onClick={() => !readOnly && onSelectZone('pelvis_anterior')}
                onMouseEnter={() => setHoveredZoneId('pelvis_anterior')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Right Upper Arm (Bras Droit) */}
              <path
                id="arm_right"
                d="M136,137 L168,137 L158,210 L130,205 Z"
                {...getZoneStyle('arm_right')}
                onClick={() => !readOnly && onSelectZone('arm_right')}
                onMouseEnter={() => setHoveredZoneId('arm_right')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Left Upper Arm (Bras Gauche) */}
              <path
                id="arm_left"
                d="M232,137 L264,137 L270,205 L242,210 Z"
                {...getZoneStyle('arm_left')}
                onClick={() => !readOnly && onSelectZone('arm_left')}
                onMouseEnter={() => setHoveredZoneId('arm_left')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Right Forearm (Avant-bras Droit) */}
              <path
                id="forearm_right"
                d="M129,210 L157,215 L146,285 L122,280 Z"
                {...getZoneStyle('forearm_right')}
                onClick={() => !readOnly && onSelectZone('forearm_right')}
                onMouseEnter={() => setHoveredZoneId('forearm_right')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Left Forearm (Avant-bras Gauche) */}
              <path
                id="forearm_left"
                d="M243,215 L271,210 L278,280 L254,285 Z"
                {...getZoneStyle('forearm_left')}
                onClick={() => !readOnly && onSelectZone('forearm_left')}
                onMouseEnter={() => setHoveredZoneId('forearm_left')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Right Hand (Main Droite) */}
              <path
                id="hand_right"
                d="M121,283 L145,288 L138,328 L114,320 Z"
                {...getZoneStyle('hand_right')}
                onClick={() => !readOnly && onSelectZone('hand_right')}
                onMouseEnter={() => setHoveredZoneId('hand_right')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Left Hand (Main Gauche) */}
              <path
                id="hand_left"
                d="M255,288 L279,283 L286,320 L262,328 Z"
                {...getZoneStyle('hand_left')}
                onClick={() => !readOnly && onSelectZone('hand_left')}
                onMouseEnter={() => setHoveredZoneId('hand_left')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Right Thigh (Cuisse Droite) */}
              <path
                id="thigh_right"
                d="M174,285 L198,295 L192,400 L160,400 Z"
                {...getZoneStyle('thigh_right')}
                onClick={() => !readOnly && onSelectZone('thigh_right')}
                onMouseEnter={() => setHoveredZoneId('thigh_right')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Left Thigh (Cuisse Gauche) */}
              <path
                id="thigh_left"
                d="M202,295 L226,285 L240,400 L208,400 Z"
                {...getZoneStyle('thigh_left')}
                onClick={() => !readOnly && onSelectZone('thigh_left')}
                onMouseEnter={() => setHoveredZoneId('thigh_left')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Right Knee (Genou Droit) */}
              <rect
                id="knee_right"
                x="158"
                y="403"
                width="35"
                height="28"
                rx="8"
                {...getZoneStyle('knee_right')}
                onClick={() => !readOnly && onSelectZone('knee_right')}
                onMouseEnter={() => setHoveredZoneId('knee_right')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Left Knee (Genou Gauche) */}
              <rect
                id="knee_left"
                x="207"
                y="403"
                width="35"
                height="28"
                rx="8"
                {...getZoneStyle('knee_left')}
                onClick={() => !readOnly && onSelectZone('knee_left')}
                onMouseEnter={() => setHoveredZoneId('knee_left')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Right Leg / Calf (Jambe Droite) */}
              <path
                id="leg_right"
                d="M159,434 L192,434 L186,530 L163,530 Z"
                {...getZoneStyle('leg_right')}
                onClick={() => !readOnly && onSelectZone('leg_right')}
                onMouseEnter={() => setHoveredZoneId('leg_right')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Left Leg / Calf (Jambe Gauche) */}
              <path
                id="leg_left"
                d="M208,434 L241,434 L237,530 L214,530 Z"
                {...getZoneStyle('leg_left')}
                onClick={() => !readOnly && onSelectZone('leg_left')}
                onMouseEnter={() => setHoveredZoneId('leg_left')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Right Foot (Pied Droit) */}
              <path
                id="foot_right"
                d="M162,533 L186,533 L190,575 L150,575 Z"
                {...getZoneStyle('foot_right')}
                onClick={() => !readOnly && onSelectZone('foot_right')}
                onMouseEnter={() => setHoveredZoneId('foot_right')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Left Foot (Pied Gauche) */}
              <path
                id="foot_left"
                d="M214,533 L238,533 L250,575 L210,575 Z"
                {...getZoneStyle('foot_left')}
                onClick={() => !readOnly && onSelectZone('foot_left')}
                onMouseEnter={() => setHoveredZoneId('foot_left')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />
            </g>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: POSTERIOR (Back View)                                             */}
          {/* ========================================================================= */}
          {activeView === 'posterior' && (
            <g id="posterior-view" className="cursor-pointer">
              {/* Occiput & Posterior Head */}
              <g
                id="head_posterior"
                onClick={() => !readOnly && onSelectZone('head_posterior')}
                onMouseEnter={() => setHoveredZoneId('head_posterior')}
                onMouseLeave={() => setHoveredZoneId(null)}
              >
                <ellipse
                  cx="200"
                  cy="50"
                  rx="26"
                  ry="32"
                  {...getZoneStyle('head_posterior')}
                  className="transition-all duration-200"
                />
                {/* Hairline / Nape Curve */}
                <path d="M182 66 Q200 75 218 66" stroke="#64748b" strokeWidth="1.5" fill="none" />
              </g>

              {/* Cervical Spine & Neck */}
              <path
                id="neck_posterior"
                d="M192,80 L208,80 L212,100 L188,100 Z"
                {...getZoneStyle('neck_posterior')}
                onClick={() => !readOnly && onSelectZone('neck_posterior')}
                onMouseEnter={() => setHoveredZoneId('neck_posterior')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Upper Back & Scapula */}
              <path
                id="upper_back"
                d="M168,102 L232,102 L238,175 L162,175 Z"
                {...getZoneStyle('upper_back')}
                onClick={() => !readOnly && onSelectZone('upper_back')}
                onMouseEnter={() => setHoveredZoneId('upper_back')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Lower Back & Lumbar */}
              <path
                id="lower_back"
                d="M164,177 L236,177 L230,238 L170,238 Z"
                {...getZoneStyle('lower_back')}
                onClick={() => !readOnly && onSelectZone('lower_back')}
                onMouseEnter={() => setHoveredZoneId('lower_back')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Gluteal & Pelvis Posterior */}
              <path
                id="gluteal"
                d="M170,240 L230,240 L226,295 L200,302 L174,295 Z"
                {...getZoneStyle('gluteal')}
                onClick={() => !readOnly && onSelectZone('gluteal')}
                onMouseEnter={() => setHoveredZoneId('gluteal')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Posterior Upper Arm Right (Triceps) */}
              <path
                id="arm_right_post"
                d="M136,137 L168,137 L158,205 L130,200 Z"
                {...getZoneStyle('arm_right_post')}
                onClick={() => !readOnly && onSelectZone('arm_right_post')}
                onMouseEnter={() => setHoveredZoneId('arm_right_post')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Posterior Upper Arm Left (Triceps) */}
              <path
                id="arm_left_post"
                d="M232,137 L264,137 L270,200 L242,205 Z"
                {...getZoneStyle('arm_left_post')}
                onClick={() => !readOnly && onSelectZone('arm_left_post')}
                onMouseEnter={() => setHoveredZoneId('arm_left_post')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Right Elbow */}
              <circle
                id="elbow_right"
                cx="144"
                cy="208"
                r="12"
                {...getZoneStyle('elbow_right')}
                onClick={() => !readOnly && onSelectZone('elbow_right')}
                onMouseEnter={() => setHoveredZoneId('elbow_right')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Left Elbow */}
              <circle
                id="elbow_left"
                cx="256"
                cy="208"
                r="12"
                {...getZoneStyle('elbow_left')}
                onClick={() => !readOnly && onSelectZone('elbow_left')}
                onMouseEnter={() => setHoveredZoneId('elbow_left')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Posterior Forearm Right */}
              <path
                id="forearm_right_post"
                d="M129,222 L157,222 L146,285 L122,280 Z"
                {...getZoneStyle('forearm_right_post')}
                onClick={() => !readOnly && onSelectZone('forearm_right_post')}
                onMouseEnter={() => setHoveredZoneId('forearm_right_post')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Posterior Forearm Left */}
              <path
                id="forearm_left_post"
                d="M243,222 L271,222 L278,280 L254,285 Z"
                {...getZoneStyle('forearm_left_post')}
                onClick={() => !readOnly && onSelectZone('forearm_left_post')}
                onMouseEnter={() => setHoveredZoneId('forearm_left_post')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Posterior Hand Right */}
              <path
                id="hand_right_post"
                d="M121,283 L145,288 L138,328 L114,320 Z"
                {...getZoneStyle('hand_right_post')}
                onClick={() => !readOnly && onSelectZone('hand_right_post')}
                onMouseEnter={() => setHoveredZoneId('hand_right_post')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Posterior Hand Left */}
              <path
                id="hand_left_post"
                d="M255,288 L279,283 L286,320 L262,328 Z"
                {...getZoneStyle('hand_left_post')}
                onClick={() => !readOnly && onSelectZone('hand_left_post')}
                onMouseEnter={() => setHoveredZoneId('hand_left_post')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Hamstrings Right (Cuisse Postérieure Droite) */}
              <path
                id="thigh_right_post"
                d="M174,295 L198,302 L192,400 L160,400 Z"
                {...getZoneStyle('thigh_right_post')}
                onClick={() => !readOnly && onSelectZone('thigh_right_post')}
                onMouseEnter={() => setHoveredZoneId('thigh_right_post')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Hamstrings Left (Cuisse Postérieure Gauche) */}
              <path
                id="thigh_left_post"
                d="M202,302 L226,295 L240,400 L208,400 Z"
                {...getZoneStyle('thigh_left_post')}
                onClick={() => !readOnly && onSelectZone('thigh_left_post')}
                onMouseEnter={() => setHoveredZoneId('thigh_left_post')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Popliteal Fossa Right (Creux Poplité Droit) */}
              <ellipse
                id="knee_right_post"
                cx="176"
                cy="415"
                rx="18"
                ry="12"
                {...getZoneStyle('knee_right_post')}
                onClick={() => !readOnly && onSelectZone('knee_right_post')}
                onMouseEnter={() => setHoveredZoneId('knee_right_post')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Popliteal Fossa Left (Creux Poplité Gauche) */}
              <ellipse
                id="knee_left_post"
                cx="224"
                cy="415"
                rx="18"
                ry="12"
                {...getZoneStyle('knee_left_post')}
                onClick={() => !readOnly && onSelectZone('knee_left_post')}
                onMouseEnter={() => setHoveredZoneId('knee_left_post')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Right Calf (Mollet Droit) */}
              <path
                id="calf_right"
                d="M159,430 L193,430 L187,530 L163,530 Z"
                {...getZoneStyle('calf_right')}
                onClick={() => !readOnly && onSelectZone('calf_right')}
                onMouseEnter={() => setHoveredZoneId('calf_right')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Left Calf (Mollet Gauche) */}
              <path
                id="calf_left"
                d="M207,430 L241,430 L237,530 L213,530 Z"
                {...getZoneStyle('calf_left')}
                onClick={() => !readOnly && onSelectZone('calf_left')}
                onMouseEnter={() => setHoveredZoneId('calf_left')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Right Heel & Achilles (Talon Droit) */}
              <path
                id="foot_right_post"
                d="M162,533 L186,533 L188,575 L154,575 Z"
                {...getZoneStyle('foot_right_post')}
                onClick={() => !readOnly && onSelectZone('foot_right_post')}
                onMouseEnter={() => setHoveredZoneId('foot_right_post')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />

              {/* Left Heel & Achilles (Talon Gauche) */}
              <path
                id="foot_left_post"
                d="M214,533 L238,533 L246,575 L212,575 Z"
                {...getZoneStyle('foot_left_post')}
                onClick={() => !readOnly && onSelectZone('foot_left_post')}
                onMouseEnter={() => setHoveredZoneId('foot_left_post')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="transition-all duration-200"
              />
            </g>
          )}
        </svg>

        {/* Live Hover Tooltip */}
        {currentHoveredZone && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700 px-3 py-1.5 rounded-xl shadow-2xl pointer-events-none text-center backdrop-blur-md z-10 whitespace-nowrap animate-in fade-in zoom-in-95">
            <span className="text-xs font-black text-white block">{currentHoveredZone.labelAr}</span>
            <span className="text-[10px] text-slate-400 font-mono block">{currentHoveredZone.labelFr}</span>
            {bodyMapState[currentHoveredZone.id] && (
              <div className="flex items-center justify-center gap-1.5 mt-1">
                {bodyMapState[currentHoveredZone.id].tonus && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                    style={{
                      backgroundColor: `${TONUS_STATES[bodyMapState[currentHoveredZone.id].tonus]?.color}33`,
                      color: TONUS_STATES[bodyMapState[currentHoveredZone.id].tonus]?.color,
                    }}
                  >
                    {TONUS_STATES[bodyMapState[currentHoveredZone.id].tonus]?.labelAr}
                  </span>
                )}
                {bodyMapState[currentHoveredZone.id].sensory && bodyMapState[currentHoveredZone.id].sensory !== 'normosensible' && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                    style={{
                      backgroundColor: `${SENSORY_STATES[bodyMapState[currentHoveredZone.id].sensory]?.color}33`,
                      color: SENSORY_STATES[bodyMapState[currentHoveredZone.id].sensory]?.color,
                    }}
                  >
                    {SENSORY_STATES[bodyMapState[currentHoveredZone.id].sensory]?.labelAr}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clinical Legend Footer */}
      <div className="w-full pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold">
        <div className="flex items-center space-x-1 space-x-reverse">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
          <span className="text-slate-400">سوية (Eutonie)</span>
        </div>
        <div className="flex items-center space-x-1 space-x-reverse">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          <span className="text-amber-400">فرط توتر (Hypertonie)</span>
        </div>
        <div className="flex items-center space-x-1 space-x-reverse">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
          <span className="text-cyan-400">رخاوة (Hypotonie)</span>
        </div>
        <div className="flex items-center space-x-1 space-x-reverse">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
          <span className="text-purple-400">باراتونيا (Paratonie)</span>
        </div>
        <div className="flex items-center space-x-1 space-x-reverse">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-rose-500 inline-block" />
          <span className="text-rose-400">دفاع لمسي</span>
        </div>
        <div className="flex items-center space-x-1 space-x-reverse">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 inline-block" />
          <span className="text-emerald-400">بحث حسي</span>
        </div>
      </div>
    </div>
  );
}
