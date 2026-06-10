import React from 'react';
interface IconProps { fillColor?: string; size?: number; }
const TeacherIcon: React.FC<IconProps> = ({ fillColor = "#0e0e10", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="13" rx="2" stroke={fillColor} strokeWidth="1.5"/>
        <path d="M8 21h8M12 16v5" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 8h2v5H7zM11 6h2v7h-2zM15 9h2v4h-2z" stroke={fillColor} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
);
export default TeacherIcon;