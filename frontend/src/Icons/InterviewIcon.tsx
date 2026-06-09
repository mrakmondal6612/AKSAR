import React from 'react';
interface IconProps { fillColor?: string; size?: number; }
const InterviewIcon: React.FC<IconProps> = ({ fillColor = "#0e0e10", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="14" rx="2" stroke={fillColor} strokeWidth="1.5"/>
        <path d="M8 21h8M12 17v4" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 10l2 2 4-4" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
export default InterviewIcon;