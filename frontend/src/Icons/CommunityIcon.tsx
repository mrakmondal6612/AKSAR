import React from 'react';
interface IconProps { fillColor?: string; size?: number; }
const CommunityIcon: React.FC<IconProps> = ({ fillColor = "#0e0e10", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="3" stroke={fillColor} strokeWidth="1.5"/>
        <circle cx="15" cy="7" r="3" stroke={fillColor} strokeWidth="1.5"/>
        <path d="M3 21v-1a6 6 0 0 1 6-6h1" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M13 21v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 0 0" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);
export default CommunityIcon;