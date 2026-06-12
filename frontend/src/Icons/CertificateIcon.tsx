import React from 'react';
interface IconProps { fillColor?: string; size?: number; }
const CertificateIcon: React.FC<IconProps> = ({ fillColor = "#0e0e10", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="14" rx="2" stroke={fillColor} strokeWidth="1.5"/>
        <path d="M7 8h10M7 12h6" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="17" cy="18" r="3" stroke={fillColor} strokeWidth="1.5"/>
        <path d="M15 21l-1 2 3-1 3 1-1-2" stroke={fillColor} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
);
export default CertificateIcon;