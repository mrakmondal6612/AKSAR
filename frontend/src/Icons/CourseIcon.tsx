import React from 'react';
interface IconProps { fillColor?: string; size?: number; }
const CoursesIcon: React.FC<IconProps> = ({ fillColor = "#0e0e10", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" stroke={fillColor} strokeWidth="1.5"/>
        <path d="M9 7h6M9 11h4" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);
export default CoursesIcon;