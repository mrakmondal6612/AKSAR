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

  /* ── Palette (matches original template) ─────────────────── */
  const BLUE      = "#1565e0";   // bright royal blue
  const GOLD      = "#c8900a";   // gold accent
  const NAVY      = "#0b1e45";   // dark navy headings
  const NAME_BLUE = "#1a52c8";   // blue for cursive name
  const CRS_BLUE  = "#1d4ed8";   // blue for course name
  const GRAY      = "#6b7280";   // secondary text
  const BGPAPER   = "#f6f8ff";   // light bluish-white background

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

        {/* Paper background */}
        <rect width="1000" height="800" fill="url(#cPaper)" />

        {/* Water-ripple concentric circles — TL */}
        {[140,190,240,290,340,390,440,490,540,590,640].map(r=>(
          <circle key={`tl${r}`} cx="0" cy="0" r={r}
            fill="none" stroke={BLUE} strokeWidth="0.75" strokeOpacity="0.05" />
        ))}
        {/* Water-ripple concentric circles — TR */}
        {[140,190,240,290,340,390,440,490,540,590,640].map(r=>(
          <circle key={`tr${r}`} cx="1000" cy="0" r={r}
            fill="none" stroke={BLUE} strokeWidth="0.75" strokeOpacity="0.05" />
        ))}

        {/* Corner dot grids (outside the border) */}
        <rect x="10"  y="10"  width="88" height="88" fill="url(#cDots)" />
        <rect x="902" y="10"  width="88" height="88" fill="url(#cDots)" />
        <rect x="10"  y="702" width="88" height="88" fill="url(#cDots)" />
        <rect x="902" y="702" width="88" height="88" fill="url(#cDots)" />

        {/* White fill + thick blue outer border */}
        <path d={borderPath} fill="#ffffff" stroke={BLUE} strokeWidth="13" strokeLinejoin="round" />

        {/* Gold inner accent (scaled slightly inward) */}
        <path d={borderPath} fill="none"
          stroke="url(#cGold)" strokeWidth="2.4" strokeLinejoin="round"
          transform="scale(0.9838)" style={{ transformOrigin:"500px 400px" }} />

        {/* Blue hairline inner accent */}
        <path d={borderPath} fill="none"
          stroke={BLUE} strokeWidth="0.75" strokeOpacity="0.28" strokeLinejoin="round"
          transform="scale(0.975)" style={{ transformOrigin:"500px 400px" }} />
      </svg>

      {/* ══════════════════════ HTML CONTENT ══════════════════════ */}
      <div
        className="c-bod"
        style={{
          position:"absolute", inset:0,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"space-between",
          padding:"4.5cqw 9cqw 3.2cqw",
          boxSizing:"border-box",
          pointerEvents:"none",
        }}
      >

        {/* ── AKSAR Logo + Brand ── */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
          {/* Orbital logo */}
          <div style={{ width:"6.2cqw", height:"6.2cqw" }}>
            <svg viewBox="0 0 100 100" style={{ width:"100%", height:"100%" }}>
              <ellipse cx="50" cy="50" rx="47" ry="13" fill="none" stroke="#5ba4f5" strokeWidth="1.7"
                transform="rotate(-20 50 50)" />
              <ellipse cx="50" cy="50" rx="47" ry="13" fill="none" stroke="#5ba4f5" strokeWidth="1.7"
                transform="rotate(40 50 50)" />
              <ellipse cx="50" cy="50" rx="47" ry="13" fill="none" stroke="#5ba4f5" strokeWidth="1.7"
                transform="rotate(100 50 50)" />
              <circle cx="50" cy="50" r="22" fill={BLUE} />
              <text x="50" y="57" textAnchor="middle"
                fontFamily="'Playfair Display',Georgia,serif"
                fontSize="21" fontWeight="bold" fill="white">A</text>
            </svg>
          </div>
          {/* AKSAR text – italic blue */}
          <span
            className="c-bod"
            style={{
              fontStyle:"italic", fontSize:"1.85cqw", fontWeight:600,
              color:BLUE, letterSpacing:"0.22em",
              marginTop:"0.2cqw", lineHeight:1,
            }}
          >
            AKSAR
          </span>
        </div>

        {/* ── "CERTIFICATE" heading ── */}
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <h1 className="c-ser" style={{
            fontSize:"5.3cqw", color:NAVY,
            letterSpacing:"0.05em", margin:0,
            lineHeight:1, fontWeight:800,
          }}>
            CERTIFICATE
          </h1>

          {/* — OF COMPLETION — */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"center",
            gap:"1.4cqw", marginTop:"0.55cqw",
          }}>
            <div style={{ height:"1.5px", width:"7cqw",
              background:`linear-gradient(to right,transparent,${GOLD})` }} />
            <span className="c-bod" style={{
              fontSize:"1.48cqw", color:GOLD,
              fontWeight:700, letterSpacing:"0.36em",
              lineHeight:1, whiteSpace:"nowrap",
            }}>
              {subtitle()}
            </span>
            <div style={{ height:"1.5px", width:"7cqw",
              background:`linear-gradient(to left,transparent,${GOLD})` }} />
          </div>
        </div>

        {/* ── Body: certify text + name + course ── */}
        <div style={{
          textAlign:"center", flex:1,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          width:"100%", padding:"0.4cqw 0",
        }}>

          {/* Top diamond flourish */}
          <div style={{ display:"flex", alignItems:"center", gap:"0.7cqw", marginBottom:"0.45cqw" }}>
            <div style={{ width:"3.2cqw", height:"1px", background:GOLD }} />
            <div style={{ width:"0.7cqw", height:"0.7cqw", background:GOLD, transform:"rotate(45deg)" }} />
            <div style={{ width:"3.2cqw", height:"1px", background:GOLD }} />
          </div>

          <p className="c-bod" style={{
            fontSize:"1.2cqw", color:GRAY,
            fontStyle:"italic", letterSpacing:"0.05em",
            margin:0, lineHeight:1,
          }}>
            This is to certify that
          </p>

          {/* ★ STUDENT NAME – dynamic */}
          <h2 className="c-cur c-sel" style={{
            fontSize:"5.5cqw", color:NAME_BLUE,
            margin:"0.15cqw 0 0", lineHeight:1.05,
            overflow:"hidden", textOverflow:"ellipsis",
            whiteSpace:"nowrap", maxWidth:"90%",
          }}>
            {name}
          </h2>

          {/* Gold line + diamond divider */}
          <div style={{
            position:"relative", width:"52%",
            display:"flex", alignItems:"center", justifyContent:"center",
            margin:"0.5cqw 0",
          }}>
            <div style={{
              height:"1px", width:"100%",
              background:`linear-gradient(to right,transparent,${GOLD} 28%,${GOLD} 72%,transparent)`,
            }} />
            <div style={{
              position:"absolute",
              width:"0.75cqw", height:"0.75cqw",
              background:GOLD, transform:"rotate(45deg)",
            }} />
          </div>

          <p className="c-bod" style={{
            fontSize:"1.2cqw", color:GRAY,
            fontStyle:"italic", letterSpacing:"0.05em",
            margin:0, lineHeight:1,
          }}>
            has successfully completed the course
          </p>

          {/* ★ COURSE NAME – dynamic */}
          <h3 className="c-bod c-sel" style={{
            fontSize:"2.45cqw", color:CRS_BLUE,
            fontWeight:700, margin:"0.3cqw 0 0",
            lineHeight:1.2, overflow:"hidden",
            textOverflow:"ellipsis", whiteSpace:"nowrap",
            maxWidth:"90%", letterSpacing:"0.02em",
          }}>
            {course}
          </h3>
        </div>

        {/* ── 4-Column Date / ID Grid – dynamic ── */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr",
          width:"100%", flexShrink:0,
        }}>
          {[
            { label:"Start Date",  val: fmt(certificate.issuedDate),    sep:true  },
            { label:"End Date",    val: fmt(certificate.completionDate), sep:true  },
            { label:"Student ID",  val: sid(),                           sep:true  },
            { label:"Course ID",   val: cid(),                           sep:false },
          ].map(({ label, val, sep }) => (
            <div key={label} className="c-sel" style={{
              textAlign:"center",
              borderRight: sep ? "1px solid rgba(200,144,10,0.35)" : "none",
              padding:"0.4cqw 0",
            }}>
              <div className="c-bod" style={{
                fontSize:"1.05cqw", color:GRAY,
                fontWeight:600, letterSpacing:"0.1em",
                textTransform:"uppercase",
              }}>
                {label}
              </div>
              <div className="c-bod c-sel" style={{
                fontSize:"1.28cqw", color:"#1e293b",
                fontWeight:700, marginTop:"0.25cqw",
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

          {/* ★ Grade Badge – dynamic */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"11cqw" }}>
            <div style={{
              width:"7.5cqw", height:"7.5cqw",
              borderRadius:"50%",
              border:"2px dotted #c8900a",
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
            }}>
              <span className="c-bod" style={{
                fontSize:"0.82cqw", color:GRAY,
                fontWeight:700, letterSpacing:"0.18em",
                textTransform:"uppercase", lineHeight:1,
              }}>
                GRADE
              </span>
              <span className="c-bod c-sel" style={{
                fontSize:"2.3cqw", color:"#1e3a8a",
                fontWeight:700, lineHeight:1,
                marginTop:"0.1cqw",
              }}>
                {certificate.grade}
              </span>
            </div>
          </div>

          {/* Gold Rosette Medal – certificateStiker.png */}
          <div style={{ flex:1, display:"flex", justifyContent:"center", alignItems:"flex-end" }}>
            <img
              src="/images/certificateStiker.png"
              alt="Gold Medal"
              style={{
                width:"9.5cqw", height:"9.5cqw",
                objectFit:"contain",
                userSelect:"none", pointerEvents:"none",
              }}
            />
          </div>

          {/* ★ QR Code – dynamic */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"11cqw" }}>
            <div style={{
              background:"#fff",
              border:"1px solid rgba(200,144,10,0.3)",
              borderRadius:"3px",
              padding:"0.45cqw",
              display:"inline-flex",
              pointerEvents:"auto",
            }}>
              <QRCodeSVG
                value={url()}
                size={100}
                bgColor="#ffffff"
                fgColor="#000000"
                level="L"
                includeMargin={false}
                style={{ width:"6.8cqw", height:"6.8cqw" }}
              />
            </div>
            <span className="c-bod" style={{
              fontSize:"0.82cqw", color:GRAY,
              fontWeight:600, marginTop:"0.4cqw",
              letterSpacing:"0.08em", textTransform:"uppercase",
              whiteSpace:"nowrap", lineHeight:1,
            }}>
              Scan to Verify
            </span>
          </div>
        </div>

        {/* ── Certificate Number ── */}
        <div style={{ textAlign:"center", flexShrink:0, marginTop:"0.5cqw", width:"100%" }}>
          {/* Gold diamond separator */}
          <div style={{
            margin:"0 auto 0.3cqw",
            width:"26%", height:"1px",
            background:`linear-gradient(to right,transparent,${GOLD} 35%,${GOLD} 65%,transparent)`,
            position:"relative",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <div style={{ width:"0.6cqw", height:"0.6cqw", background:GOLD, transform:"rotate(45deg)" }} />
          </div>
          <p className="c-bod c-sel" style={{
            fontSize:"1.1cqw", color:"#334155",
            fontWeight:700, letterSpacing:"0.1em",
            textTransform:"uppercase", margin:0, lineHeight:1,
          }}>
            Certificate No:{" "}
            <span style={{ color:NAVY }}>{certNo()}</span>
          </p>
        </div>

      </div>
    </div>
  );
};

export default CertificateTemplate;
