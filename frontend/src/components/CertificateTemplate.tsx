import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface CertificateTemplateProps {
  certificate: {
    marksheetId: string;
    user: { firstName: string; lastName: string };
    course: { courseName: string };
    test?: { title: string };
    grade: string;
    percentage: number;
    completionDate: string;
    issuedDate: string;
    certificateType: string;
  };
}

const CertificateTemplate: React.FC<CertificateTemplateProps> = ({ certificate }) => {
  /* ── Helpers ─────────────────────────────────────────────── */
  const fmt = (d: string) => {
    if (!d) return "DD MMM YYYY";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "DD MMM YYYY";
    const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${String(dt.getDate()).padStart(2,"0")} ${M[dt.getMonth()]} ${dt.getFullYear()}`;
  };

  const url = () =>
    `${window.location.origin}/verify-certificate?id=${certificate.marksheetId}`;

  const sid = () => {
    const n = certificate.user.firstName.substring(0,3).toUpperCase().padEnd(3,"X");
    const h = (certificate.marksheetId ?? "0000").slice(-4).toUpperCase();
    return `STU-${n}${h}`;
  };

  const cid = () => {
    const src = certificate.test?.title ?? certificate.course?.courseName ?? "CRS";
    const n = src.substring(0,3).toUpperCase().padEnd(3,"X");
    const h = (certificate.marksheetId ?? "0000").slice(0,4).toUpperCase();
    return `CRS-${n}${h}`;
  };

  const certNo = () => {
    const y = certificate.issuedDate
      ? new Date(certificate.issuedDate).getFullYear()
      : new Date().getFullYear();
    const h = (certificate.marksheetId ?? "00000000").slice(-8).toUpperCase();
    return `AKSAR-${y}-${h}`;
  };

  const subtitle = () => {
    if (certificate.certificateType === "TEST_RESULT") return "OF ACHIEVEMENT";
    if (certificate.certificateType === "OTHERS")      return "OF EXCELLENCE";
    return "OF COMPLETION";
  };

  const name   = `${certificate.user.firstName} ${certificate.user.lastName}`;
  const course = certificate.test?.title ?? certificate.course?.courseName ?? "Course Name";

  /* ── Enhanced Palette ──────────────────────────────────────── */
  const BLUE      = "#1e40af";   // deeper royal blue
  const GOLD      = "#d4a017";   // richer gold accent
  const NAVY      = "#0f172a";   // darker navy headings
  const NAME_BLUE = "#2563eb";   // vibrant blue for cursive name
  const CRS_BLUE  = "#1d4ed8";   // blue for course name
  const GRAY      = "#475569";   // darker secondary text
  const BGPAPER   = "#f8fafc";   // cleaner white background

  /* ── SVG border path (shared) ────────────────────────────── */
  const borderPath = `
    M 158 52
    C 262 -6, 366 90, 500 52
    C 634 90, 738 -6, 842 52
    Q 876 118, 948 150
    Q 910 400, 948 650
    Q 876 682, 842 748
    C 738 806, 634 710, 500 748
    C 366 710, 262 806, 158 748
    Q 124 682, 52 650
    Q 90 400, 52 150
    Q 124 118, 158 52 Z
  `;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "920px",
        margin: "0 auto",
        aspectRatio: "5 / 4",
        overflow: "hidden",
        /* container queries so cqw units work */
        containerType: "inline-size",
      }}
    >
      {/* ── Google Fonts ─────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@700;800&family=Montserrat:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        .c-cur  { font-family:'Great Vibes',cursive; }
        .c-ser  { font-family:'Playfair Display',Georgia,serif; }
        .c-bod  { font-family:'Montserrat',sans-serif; }
        .c-sel  { user-select:text; pointer-events:auto; }
      `}</style>

      {/* ══════════════════════ SVG BACKGROUND ══════════════════════ */}
      <svg
        viewBox="0 0 1000 800"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}
      >
        <defs>
          <linearGradient id="cPaper" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor={BGPAPER} />
            <stop offset="100%" stopColor="#edf1ff" />
          </linearGradient>
          <linearGradient id="cGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#f9e07a" />
            <stop offset="28%"  stopColor={GOLD} />
            <stop offset="65%"  stopColor="#f9e07a" />
            <stop offset="100%" stopColor="#a87208" />
          </linearGradient>
          <pattern id="cDots" x="0" y="0" width="11" height="11" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="1.4" fill={BLUE} opacity="0.22" />
          </pattern>
        </defs>

        {/* Paper background with subtle texture */}
        <rect width="1000" height="800" fill="url(#cPaper)" />
        {/* Subtle paper texture overlay */}
        <rect width="1000" height="800" fill="#ffffff" opacity="0.03" />

        {/* Enhanced water-ripple concentric circles — TL */}
        {[120,170,220,270,320,370,420,470,520,570,620,670].map(r=>(
          <circle key={`tl${r}`} cx="0" cy="0" r={r}
            fill="none" stroke={BLUE} strokeWidth="0.8" strokeOpacity="0.06" />
        ))}
        {/* Enhanced water-ripple concentric circles — TR */}
        {[120,170,220,270,320,370,420,470,520,570,620,670].map(r=>(
          <circle key={`tr${r}`} cx="1000" cy="0" r={r}
            fill="none" stroke={BLUE} strokeWidth="0.8" strokeOpacity="0.06" />
        ))}
        {/* Bottom corner ripples — BL */}
        {[120,170,220,270,320,370,420,470,520,570,620,670].map(r=>(
          <circle key={`bl${r}`} cx="0" cy="800" r={r}
            fill="none" stroke={BLUE} strokeWidth="0.8" strokeOpacity="0.06" />
        ))}
        {/* Bottom corner ripples — BR */}
        {[120,170,220,270,320,370,420,470,520,570,620,670].map(r=>(
          <circle key={`br${r}`} cx="1000" cy="800" r={r}
            fill="none" stroke={BLUE} strokeWidth="0.8" strokeOpacity="0.06" />
        ))}

        {/* Enhanced corner dot grids with better spacing */}
        <rect x="8"   y="8"   width="95" height="95" fill="url(#cDots)" />
        <rect x="897" y="8"   width="95" height="95" fill="url(#cDots)" />
        <rect x="8"   y="697" width="95" height="95" fill="url(#cDots)" />
        <rect x="897" y="697" width="95" height="95" fill="url(#cDots)" />

        {/* White fill + enhanced thick blue outer border */}
        <path d={borderPath} fill="#ffffff" stroke={BLUE} strokeWidth="14" strokeLinejoin="round" filter="drop-shadow(0 2px 4px rgba(30,64,175,0.15))" />

        {/* Enhanced gold inner accent with better visibility */}
        <path d={borderPath} fill="none"
          stroke="url(#cGold)" strokeWidth="2.8" strokeLinejoin="round"
          transform="scale(0.9838)" style={{ transformOrigin:"500px 400px" }} />

        {/* Enhanced blue hairline inner accent */}
        <path d={borderPath} fill="none"
          stroke={BLUE} strokeWidth="1" strokeOpacity="0.35" strokeLinejoin="round"
          transform="scale(0.975)" style={{ transformOrigin:"500px 400px" }} />
      </svg>

      {/* ══════════════════════ HTML CONTENT ══════════════════════ */}
      <div
        className="c-bod"
        style={{
          position:"absolute", inset:0,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"space-between",
          padding:"5.5cqw 9.5cqw 4.5cqw",
          boxSizing:"border-box",
          pointerEvents:"none",
        }}
      >

        {/* ── Enhanced AKSAR Logo + Brand ── */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
          {/* Enhanced orbital logo with glow effect */}
          <div style={{ width:"6.5cqw", height:"6.5cqw", filter:"drop-shadow(0 4px 8px rgba(30,64,175,0.25))" }}>
            <svg viewBox="0 0 100 100" style={{ width:"100%", height:"100%" }}>
              <defs>
                <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={BLUE} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="35" fill="url(#logoGlow)" />
              <ellipse cx="50" cy="50" rx="47" ry="13" fill="none" stroke={BLUE} strokeWidth="2"
                transform="rotate(-20 50 50)" opacity="0.8" />
              <ellipse cx="50" cy="50" rx="47" ry="13" fill="none" stroke={BLUE} strokeWidth="2"
                transform="rotate(40 50 50)" opacity="0.8" />
              <ellipse cx="50" cy="50" rx="47" ry="13" fill="none" stroke={BLUE} strokeWidth="2"
                transform="rotate(100 50 50)" opacity="0.8" />
              <circle cx="50" cy="50" r="22" fill={BLUE} />
              <text x="50" y="57" textAnchor="middle"
                fontFamily="'Playfair Display',Georgia,serif"
                fontSize="22" fontWeight="bold" fill="white">A</text>
            </svg>
          </div>
          {/* AKSAR text – enhanced italic blue with better spacing */}
          <span
            className="c-bod"
            style={{
              fontStyle:"italic", fontSize:"1.9cqw", fontWeight:700,
              color:BLUE, letterSpacing:"0.25em",
              marginTop:"0.3cqw", lineHeight:1,
              textShadow:"0 1px 2px rgba(30,64,175,0.1)",
            }}
          >
            AKSAR
          </span>
        </div>

        {/* ── Enhanced "CERTIFICATE" heading ── */}
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <h1 className="c-ser" style={{
            fontSize:"5.5cqw", color:NAVY,
            letterSpacing:"0.08em", margin:0,
            lineHeight:1, fontWeight:800,
            textShadow:"0 2px 4px rgba(15,23,42,0.1)",
          }}>
            CERTIFICATE
          </h1>

          {/* — OF COMPLETION — with enhanced styling */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"center",
            gap:"1.5cqw", marginTop:"0.6cqw",
          }}>
            <div style={{ height:"2px", width:"8cqw",
              background:`linear-gradient(to right,transparent,${GOLD} 50%,${GOLD})` }} />
            <span className="c-bod" style={{
              fontSize:"1.55cqw", color:GOLD,
              fontWeight:700, letterSpacing:"0.4em",
              lineHeight:1, whiteSpace:"nowrap",
              textShadow:"0 1px 2px rgba(212,160,23,0.2)",
            }}>
              {subtitle()}
            </span>
            <div style={{ height:"2px", width:"8cqw",
              background:`linear-gradient(to left,transparent,${GOLD} 50%,${GOLD})` }} />
          </div>
        </div>

        {/* ── Body: certify text + name + course ── */}
        <div style={{
          textAlign:"center", flex:1,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          width:"100%", padding:"0.4cqw 0",
        }}>

          {/* Enhanced top diamond flourish */}
          <div style={{ display:"flex", alignItems:"center", gap:"0.8cqw", marginBottom:"0.5cqw" }}>
            <div style={{ width:"3.5cqw", height:"1.5px", background:GOLD, borderRadius:"1px" }} />
            <div style={{ width:"0.8cqw", height:"0.8cqw", background:GOLD, transform:"rotate(45deg)", boxShadow:"0 0 4px rgba(212,160,23,0.3)" }} />
            <div style={{ width:"3.5cqw", height:"1.5px", background:GOLD, borderRadius:"1px" }} />
          </div>

          <p className="c-bod" style={{
            fontSize:"1.2cqw", color:GRAY,
            fontStyle:"italic", letterSpacing:"0.05em",
            margin:0, lineHeight:1,
          }}>
            This is to certify that
          </p>

          {/* ★ Enhanced STUDENT NAME – dynamic */}
          <h2 className="c-cur c-sel" style={{
            fontSize:"5.8cqw", color:NAME_BLUE,
            margin:"0.2cqw 0 0", lineHeight:1.05,
            overflow:"hidden", textOverflow:"ellipsis",
            whiteSpace:"nowrap", maxWidth:"90%",
            textShadow:"0 2px 4px rgba(37,99,235,0.15)",
          }}>
            {name}
          </h2>

          {/* Enhanced gold line + diamond divider */}
          <div style={{
            position:"relative", width:"55%",
            display:"flex", alignItems:"center", justifyContent:"center",
            margin:"0.6cqw 0",
          }}>
            <div style={{
              height:"1.5px", width:"100%",
              background:`linear-gradient(to right,transparent,${GOLD} 25%,${GOLD} 75%,transparent)`,
            }} />
            <div style={{
              position:"absolute",
              width:"0.85cqw", height:"0.85cqw",
              background:GOLD, transform:"rotate(45deg)",
              boxShadow:"0 0 6px rgba(212,160,23,0.4)",
            }} />
          </div>

          <p className="c-bod" style={{
            fontSize:"1.2cqw", color:GRAY,
            fontStyle:"italic", letterSpacing:"0.05em",
            margin:0, lineHeight:1,
          }}>
            has successfully completed the course
          </p>

          {/* ★ Enhanced COURSE NAME – dynamic */}
          <h3 className="c-bod c-sel" style={{
            fontSize:"2.6cqw", color:CRS_BLUE,
            fontWeight:700, margin:"0.35cqw 0 0",
            lineHeight:1.2, overflow:"hidden",
            textOverflow:"ellipsis", whiteSpace:"nowrap",
            maxWidth:"90%", letterSpacing:"0.04em",
            textShadow:"0 1px 2px rgba(29,78,216,0.1)",
          }}>
            {course}
          </h3>
        </div>

        {/* ── Enhanced 4-Column Date / ID Grid – dynamic ── */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr",
          width:"100%", flexShrink:0,
          background:"linear-gradient(to bottom, transparent, rgba(212,160,23,0.03), transparent)",
          borderRadius:"4px",
          padding:"0.3cqw 0",
        }}>
          {[
            { label:"Start Date",  val: fmt(certificate.issuedDate),    sep:true  },
            { label:"End Date",    val: fmt(certificate.completionDate), sep:true  },
            { label:"Student ID",  val: sid(),                           sep:true  },
            { label:"Course ID",   val: cid(),                           sep:false },
          ].map(({ label, val, sep }) => (
            <div key={label} className="c-sel" style={{
              textAlign:"center",
              borderRight: sep ? "1px solid rgba(212,160,23,0.25)" : "none",
              padding:"0.5cqw 0",
              transition:"all 0.2s ease",
            }}>
              <div className="c-bod" style={{
                fontSize:"1.1cqw", color:GRAY,
                fontWeight:600, letterSpacing:"0.12em",
                textTransform:"uppercase",
              }}>
                {label}
              </div>
              <div className="c-bod c-sel" style={{
                fontSize:"1.35cqw", color:"#1e293b",
                fontWeight:700, marginTop:"0.3cqw",
                whiteSpace:"nowrap",
              }}>
                {val}
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer: Grade | Medal | QR ── */}
        <div style={{
          display:"flex", alignItems:"flex-end",
          justifyContent:"space-between",
          width:"100%", flexShrink:0,
          marginTop:"0.6cqw",
        }}>

          {/* ★ Enhanced Grade Badge – dynamic */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"11cqw" }}>
            <div style={{
              width:"7.8cqw", height:"7.8cqw",
              borderRadius:"50%",
              border:"2.5px dotted #d4a017",
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
              background:"linear-gradient(135deg, rgba(212,160,23,0.05), rgba(212,160,23,0.1))",
              boxShadow:"0 4px 12px rgba(212,160,23,0.2)",
            }}>
              <span className="c-bod" style={{
                fontSize:"0.85cqw", color:GRAY,
                fontWeight:700, letterSpacing:"0.2em",
                textTransform:"uppercase", lineHeight:1,
              }}>
                GRADE
              </span>
              <span className="c-bod c-sel" style={{
                fontSize:"2.4cqw", color:"#1e3a8a",
                fontWeight:800, lineHeight:1,
                marginTop:"0.15cqw",
              }}>
                {certificate.grade}
              </span>
            </div>
          </div>

          {/* Enhanced Gold Rosette Medal – certificateStiker.png */}
          <div style={{ flex:1, display:"flex", justifyContent:"center", alignItems:"flex-end" }}>
            <img
              src="/images/certificateStiker.png"
              alt="Gold Medal"
              style={{
                width:"10cqw", height:"10cqw",
                objectFit:"contain",
                userSelect:"none", pointerEvents:"none",
                filter:"drop-shadow(0 6px 12px rgba(212,160,23,0.3))",
              }}
            />
          </div>

          {/* ★ Enhanced QR Code – dynamic with elegant frame */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"11cqw" }}>
            <div style={{
              position:"relative",
              background:"#fff",
              borderRadius:"6px",
              padding:"0.6cqw",
              display:"inline-flex",
              pointerEvents:"auto",
              boxShadow:"0 6px 16px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)",
            }}>
              {/* Outer gold border */}
              <div style={{
                position:"absolute",
                inset:0,
                borderRadius:"6px",
                border:"2px solid",
                borderColor:GOLD,
                pointerEvents:"none",
              }} />
              {/* Inner gold accent border */}
              <div style={{
                position:"absolute",
                inset:"3px",
                borderRadius:"4px",
                border:"1px solid",
                borderColor:"rgba(212,160,23,0.3)",
                pointerEvents:"none",
              }} />
              {/* Corner decorations */}
              <div style={{
                position:"absolute",
                top:"-2px", left:"-2px",
                width:"8px", height:"8px",
                borderTop:"2px solid", borderLeft:"2px solid",
                borderColor:GOLD,
              }} />
              <div style={{
                position:"absolute",
                top:"-2px", right:"-2px",
                width:"8px", height:"8px",
                borderTop:"2px solid", borderRight:"2px solid",
                borderColor:GOLD,
              }} />
              <div style={{
                position:"absolute",
                bottom:"-2px", left:"-2px",
                width:"8px", height:"8px",
                borderBottom:"2px solid", borderLeft:"2px solid",
                borderColor:GOLD,
              }} />
              <div style={{
                position:"absolute",
                bottom:"-2px", right:"-2px",
                width:"8px", height:"8px",
                borderBottom:"2px solid", borderRight:"2px solid",
                borderColor:GOLD,
              }} />
              <QRCodeSVG
                value={url()}
                size={100}
                bgColor="#ffffff"
                fgColor="#000000"
                level="L"
                includeMargin={false}
                style={{ width:"7.2cqw", height:"7.2cqw" }}
              />
            </div>
            <span className="c-bod" style={{
              fontSize:"0.85cqw", color:GRAY,
              fontWeight:600, marginTop:"0.5cqw",
              letterSpacing:"0.1em", textTransform:"uppercase",
              whiteSpace:"nowrap", lineHeight:1,
            }}>
              Scan to Verify
            </span>
          </div>
        </div>

        {/* ── Enhanced Certificate Number ── */}
        <div style={{ textAlign:"center", flexShrink:0, marginTop:"0.6cqw", width:"100%" }}>
          {/* Enhanced gold diamond separator */}
          <div style={{
            margin:"0 auto 0.35cqw",
            width:"28%", height:"1.5px",
            background:`linear-gradient(to right,transparent,${GOLD} 30%,${GOLD} 70%,transparent)`,
            position:"relative",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <div style={{ 
              width:"0.7cqw", height:"0.7cqw", 
              background:GOLD, transform:"rotate(45deg)",
              boxShadow:"0 0 4px rgba(212,160,23,0.3)",
            }} />
          </div>
          <p className="c-bod c-sel" style={{
            fontSize:"1.15cqw", color:"#334155",
            fontWeight:700, letterSpacing:"0.12em",
            textTransform:"uppercase", margin:0, lineHeight:1,
          }}>
            Certificate No:{" "}
            <span style={{ color:NAVY, fontWeight:800 }}>{certNo()}</span>
          </p>
        </div>

      </div>
    </div>
  );
};

export default CertificateTemplate;
