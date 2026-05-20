import { useState } from "react";

const C = {
  bg: "#1e2028", bgCard: "#2a2d36", bgCardLight: "#32353f", bgInput: "#13151a",
  green: "#00d4aa", yellow: "#f5c842", white: "#ffffff",
  grey1: "#b0b4c0", grey2: "#7a7f8e", grey3: "#3e4250", red: "#e05252", border: "#3a3d48",
};

const today = () => new Date().toLocaleDateString("es-ES");
const fmt = (n) => `${Number(n).toFixed(2)}€`;

// ── DATOS ────────────────────────────────────────────────────────────────────
const SPORTS_DATA = {
  "Fútbol": {
    icon: "⚽",
    leagues: ["Premier League", "LaLiga", "Serie A", "Bundesliga", "Ligue 1", "Champions League", "Europa League", "Conference League", "Eredivisie", "Primeira Liga", "Liga turca", "Liga belga", "Liga escocesa", "Libertadores", "Sudamericana", "Brasileirao", "Liga Argentina", "Liga MX", "MLS", "Saudi Pro League", "Liga Japonesa", "Eliminatorias Mundial", "Eurocopa", "Copa América", "Nations League", "Mundial"]
  },
  "Tenis": {
    icon: "🎾",
    leagues: ["Roland Garros", "Wimbledon", "US Open", "Australian Open", "ATP Masters 1000", "ATP 500", "ATP 250", "WTA 1000", "WTA 500", "Davis Cup", "Copa Billie Jean King"]
  },
  "NBA": {
    icon: "🏀",
    leagues: ["NBA Regular Season", "NBA Playoffs", "NBA Finals"]
  },
  "NFL": {
    icon: "🏈",
    leagues: ["NFL Regular Season", "NFL Playoffs", "Super Bowl"]
  },
  "Pádel": {
    icon: "🏓",
    leagues: ["World Padel Tour", "Premier Padel", "Liga Nacional Pádel"]
  }
};

const MARKETS = {
  "Fútbol": ["1X2 (Resultado final)", "Doble oportunidad", "Ambos marcan", "Más/Menos goles", "Hándicap asiático", "Resultado al descanso", "Goles primer tiempo", "Corners", "Tarjetas", "Primer goleador", "Total goles equipo"],
  "Tenis": ["Ganador partido", "Hándicap sets", "Total juegos", "Ganador set", "Más/Menos juegos", "Total juegos set 1"],
  "NBA": ["Ganador partido", "Hándicap puntos", "Total puntos", "Ganador cuarto", "Total puntos equipo", "Triple doble"],
  "NFL": ["Ganador partido", "Hándicap puntos", "Total puntos", "Primera mitad", "Total touchdowns"],
  "Pádel": ["Ganador partido", "Hándicap sets", "Total juegos"]
};

// ── SMALL COMPONENTS ──────────────────────────────────────────────────────────
const Pill = ({ type }) => {
  const map = { diaria: ["DIARIA", C.green], soñadora: ["SOÑADORA", C.yellow], demanda: ["A DEMANDA", "#7c9fff"], alerta: ["ALERTA VALOR", "#ff9944"] };
  const [label, color] = map[type] || [type, C.grey2];
  return <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, letterSpacing: 0.8 }}>{label}</span>;
};

const OddsBadge = ({ value, color = C.yellow }) => (
  <div style={{ background: C.bgCardLight, borderRadius: 6, padding: "6px 14px", textAlign: "center", minWidth: 56 }}>
    <div style={{ color, fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{Number(value).toFixed(2)}</div>
  </div>
);

const ResultTag = ({ result }) => {
  if (!result) return <span style={{ color: C.grey2, fontSize: 12 }}>Pendiente</span>;
  const map = { ganada: [C.green, "GANADA"], perdida: [C.red, "PERDIDA"], parcial: [C.yellow, "PARCIAL"] };
  const [color, label] = map[result] || [C.grey2, result];
  return <span style={{ color, fontWeight: 700, fontSize: 12 }}>{label}</span>;
};

const Confidence = ({ value }) => {
  const bars = 5;
  const filled = Math.round((value / 100) * bars);
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} style={{ width: 18, height: 4, borderRadius: 2, background: i < filled ? C.green : C.grey3 }} />
      ))}
      <span style={{ color: C.grey2, fontSize: 11, marginLeft: 4 }}>{value}%</span>
    </div>
  );
};

const Spinner = () => (
  <div style={{ display: "flex", gap: 5, alignItems: "center", justifyContent: "center" }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, animation: `b365pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
    ))}
  </div>
);

const Divider = () => <div style={{ height: 1, background: C.border, margin: "0 -16px" }} />;

const EmptyState = ({ icon, title, subtitle }) => (
  <div style={{ textAlign: "center", padding: "60px 20px" }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
    <div style={{ color: C.white, fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{title}</div>
    <div style={{ color: C.grey2, fontSize: 14, lineHeight: 1.6 }}>{subtitle}</div>
  </div>
);

const selectStyle = {
  width: "100%", background: C.bgInput, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: "12px 14px", color: C.white, fontSize: 14,
  outline: "none", fontFamily: "inherit", boxSizing: "border-box", appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237a7f8e' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
};

// ── MODAL ANÁLISIS ────────────────────────────────────────────────────────────
const AnalysisModal = ({ bet, onClose }) => {
  if (!bet) return null;
  const lines = (bet.analysis || "Sin análisis disponible.").split("\n");
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 200, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div style={{ background: C.bgCard, borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "80vh", overflowY: "auto", padding: 24 }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ color: C.white, fontWeight: 700, fontSize: 17, marginBottom: 4 }}>
          {bet.match || (bet.selections ? "Combinada soñadora" : "Análisis")}
        </div>
        {bet.market && <div style={{ color: C.green, fontSize: 13, marginBottom: 16 }}>{bet.market}</div>}
        <Divider />
        <div style={{ marginTop: 16, color: C.grey1, fontSize: 14, lineHeight: 1.75 }}>
          {lines.map((line, i) => {
            if (line.startsWith("**") && line.endsWith("**")) return <div key={i} style={{ color: C.white, fontWeight: 700, fontSize: 15, marginTop: 14, marginBottom: 2 }}>{line.replace(/\*\*/g, "")}</div>;
            if (line === "") return <div key={i} style={{ height: 4 }} />;
            return <div key={i}>{line}</div>;
          })}
        </div>
        <button onClick={onClose} style={{ marginTop: 20, width: "100%", background: C.bgCardLight, border: "none", borderRadius: 10, padding: "14px 0", color: C.grey1, fontSize: 15, cursor: "pointer", fontWeight: 600 }}>Cerrar</button>
      </div>
    </div>
  );
};

// ── TARJETA DIARIA ────────────────────────────────────────────────────────────
const DailyCard = ({ bet, stake, onAnalysis }) => (
  <div style={{ background: C.bgCard, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
    <div style={{ background: C.green + "18", borderBottom: `1px solid ${C.green}33`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Pill type="diaria" />
      <span style={{ color: C.grey2, fontSize: 12 }}>{bet.league}</span>
    </div>
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.white, fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{bet.match}</div>
          <div style={{ color: C.grey2, fontSize: 13 }}>{bet.sport}</div>
        </div>
        <OddsBadge value={bet.odds} />
      </div>
      <div style={{ background: C.bgCardLight, borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: C.green, fontSize: 16 }}>📌</span>
        <span style={{ color: C.white, fontSize: 14, fontWeight: 600 }}>{bet.market}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ color: C.grey2, fontSize: 11, marginBottom: 5 }}>CONFIANZA</div><Confidence value={bet.confidence} /></div>
        {stake && <div style={{ textAlign: "right" }}><div style={{ color: C.grey2, fontSize: 11, marginBottom: 2 }}>STAKE</div><div style={{ color: C.white, fontWeight: 700, fontSize: 18 }}>{fmt(stake)}</div></div>}
      </div>
    </div>
    <Divider />
    <button onClick={() => onAnalysis(bet)} style={{ width: "100%", background: "none", border: "none", padding: "13px 16px", color: C.green, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>Ver análisis completo</span><span style={{ fontSize: 18 }}>›</span>
    </button>
  </div>
);

const DreamCard = ({ bet, stake, onAnalysis }) => (
  <div style={{ background: C.bgCard, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
    <div style={{ background: C.yellow + "18", borderBottom: `1px solid ${C.yellow}33`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Pill type="soñadora" />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: C.grey2, fontSize: 12 }}>CUOTA TOTAL</span>
        <span style={{ color: C.yellow, fontWeight: 700, fontSize: 18 }}>{bet.totalOdds.toFixed(2)}</span>
      </div>
    </div>
    <div style={{ padding: "12px 16px" }}>
      {bet.selections.map((s, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.white, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{s.match}</div>
              <div style={{ color: C.grey2, fontSize: 12 }}>{s.sport} · {s.pick}</div>
            </div>
            <OddsBadge value={s.odds} color={C.yellow} />
          </div>
          {i < bet.selections.length - 1 && <Divider />}
        </div>
      ))}
    </div>
    {stake && <div style={{ padding: "0 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: C.grey2, fontSize: 13 }}>Stake recomendado</span>
      <span style={{ color: C.yellow, fontWeight: 700, fontSize: 18 }}>{fmt(stake)}</span>
    </div>}
    <Divider />
    <button onClick={() => onAnalysis(bet)} style={{ width: "100%", background: "none", border: "none", padding: "13px 16px", color: C.yellow, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>Ver análisis completo</span><span style={{ fontSize: 18 }}>›</span>
    </button>
  </div>
);

// ── INICIO ────────────────────────────────────────────────────────────────────
const HomeTab = ({ budget, setBudget, distribution, setDistribution, onAnalysis, dailyBet, dreamBet, loadingBets, generateBets, streak }) => {
  const [input, setInput] = useState(budget || "");
  const calc = (val) => {
    const n = parseFloat(val);
    if (!n || n <= 0) return;
    setBudget(n);
    setDistribution({ diaria: +(n * 0.55).toFixed(2), sonadora: +(n * 0.10).toFixed(2), demanda: +(n * 0.35).toFixed(2) });
  };
  return (
    <div>
      <div style={{ background: C.bgCard, borderRadius: 12, padding: 16, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: C.grey2, fontSize: 11, marginBottom: 4, letterSpacing: 0.8 }}>RACHA ACTUAL</div>
          <div style={{ color: streak > 0 ? C.green : streak < 0 ? C.red : C.grey2, fontWeight: 700, fontSize: 28 }}>
            {streak === 0 ? "—" : streak > 0 ? `+${streak} días` : `${streak} días`}
          </div>
          <div style={{ color: C.grey2, fontSize: 12, marginTop: 2 }}>{streak === 0 ? "Sin datos aún" : streak >= 3 ? "Sigue así 🔥" : streak > 0 ? "Buen ritmo" : "Ajusta el riesgo ⚠️"}</div>
        </div>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.bgCardLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
          {streak === 0 ? "📊" : streak >= 3 ? "🔥" : streak > 0 ? "✅" : "⚠️"}
        </div>
      </div>

      <div style={{ background: C.bgCard, borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ color: C.grey2, fontSize: 11, letterSpacing: 0.8, marginBottom: 12 }}>PRESUPUESTO DEL DÍA</div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", background: C.bgInput, borderRadius: 8, padding: "0 12px", border: `1px solid ${C.border}` }}>
            <span style={{ color: C.grey2, fontSize: 16, marginRight: 4 }}>€</span>
            <input type="number" placeholder="0.00" value={input} onChange={e => setInput(e.target.value)}
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.white, fontSize: 18, fontWeight: 600, padding: "12px 0", fontFamily: "inherit" }} />
          </div>
          <button onClick={() => { calc(input); generateBets(); }} style={{ background: C.green, border: "none", borderRadius: 8, padding: "0 20px", color: "#000", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>OK</button>
        </div>
        {distribution && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
            {[{ l: "DIARIA", v: distribution.diaria, c: C.green }, { l: "SOÑADORA", v: distribution.sonadora, c: C.yellow }, { l: "DEMANDA", v: distribution.demanda, c: "#7c9fff" }].map(i => (
              <div key={i.l} style={{ background: C.bgCardLight, borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ color: C.grey2, fontSize: 9, marginBottom: 4, letterSpacing: 0.6 }}>{i.l}</div>
                <div style={{ color: i.c, fontWeight: 700, fontSize: 16 }}>{fmt(i.v)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!distribution ? (
        <EmptyState icon="💰" title="Introduce tu presupuesto" subtitle={"Introduce cuánto quieres apostar hoy\ny la IA generará las apuestas del día."} />
      ) : loadingBets ? (
        <div style={{ background: C.bgCard, borderRadius: 12, padding: 40, textAlign: "center" }}>
          <div style={{ color: C.grey2, fontSize: 14, marginBottom: 16 }}>Analizando partidos del día...</div>
          <Spinner />
        </div>
      ) : (
        <>
          <div style={{ color: C.grey2, fontSize: 11, letterSpacing: 0.8, marginBottom: 10 }}>APUESTAS DE HOY</div>
          {dailyBet && <DailyCard bet={dailyBet} stake={distribution?.diaria} onAnalysis={onAnalysis} />}
          {dreamBet && <DreamCard bet={dreamBet} stake={distribution?.sonadora} onAnalysis={onAnalysis} />}
        </>
      )}
    </div>
  );
};

// ── SELECTOR DE PARTIDO ───────────────────────────────────────────────────────
const MatchSelector = ({ index, sel, onUpdate, onRemove, showRemove, showMarket }) => {
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matches, setMatches] = useState([]);

  const sport = sel.sport || "Fútbol";
  const leagues = SPORTS_DATA[sport]?.leagues || [];

  const fetchMatches = async (league) => {
    if (!league) return;
    setLoadingMatches(true);
    setMatches([]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: [{ role: "user", content: `Lista los 6 partidos más importantes de ${league} que se juegan hoy ${today()} o en los próximos 2 días. Responde SOLO en JSON sin markdown: {"matches":["Equipo A vs Equipo B","Equipo C vs Equipo D",...]}` }]
        })
      });
      const data = await res.json();
      const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setMatches(parsed.matches || []);
    } catch { setMatches([]); }
    setLoadingMatches(false);
  };

  return (
    <div style={{ background: C.bgCard, borderRadius: 12, padding: 16, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: C.grey2, fontSize: 12, fontWeight: 600 }}>SELECCIÓN {index + 1}</span>
        {showRemove && <button onClick={onRemove} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 20 }}>×</button>}
      </div>

      {/* Deporte */}
      <div style={{ color: C.grey2, fontSize: 11, marginBottom: 6 }}>DEPORTE</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {Object.entries(SPORTS_DATA).map(([s, d]) => (
          <button key={s} onClick={() => { onUpdate("sport", s); onUpdate("league", ""); onUpdate("match", ""); setMatches([]); }} style={{
            background: sport === s ? C.green : C.bgCardLight, color: sport === s ? "#000" : C.grey2,
            border: "none", borderRadius: 20, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{d.icon} {s}</button>
        ))}
      </div>

      {/* Competición */}
      <div style={{ color: C.grey2, fontSize: 11, marginBottom: 6 }}>COMPETICIÓN</div>
      <select value={sel.league || ""} onChange={e => { onUpdate("league", e.target.value); onUpdate("match", ""); fetchMatches(e.target.value); }} style={{ ...selectStyle, marginBottom: 12 }}>
        <option value="">Selecciona competición...</option>
        {leagues.map(l => <option key={l} value={l} style={{ background: C.bgCard }}>{l}</option>)}
      </select>

      {/* Partido */}
      <div style={{ color: C.grey2, fontSize: 11, marginBottom: 6 }}>PARTIDO</div>
      {loadingMatches ? (
        <div style={{ background: C.bgInput, borderRadius: 8, padding: 14, textAlign: "center" }}><Spinner /></div>
      ) : (
        <select value={sel.match || ""} onChange={e => onUpdate("match", e.target.value)} style={{ ...selectStyle, marginBottom: showMarket ? 12 : 0 }} disabled={!sel.league}>
          <option value="">{sel.league ? "Selecciona partido..." : "Primero selecciona competición"}</option>
          {matches.map(m => <option key={m} value={m} style={{ background: C.bgCard }}>{m}</option>)}
        </select>
      )}

      {/* Mercado (solo en modo Mi apuesta) */}
      {showMarket && (
        <>
          <div style={{ color: C.grey2, fontSize: 11, marginBottom: 6 }}>MERCADO</div>
          <select value={sel.market || ""} onChange={e => onUpdate("market", e.target.value)} style={selectStyle} disabled={!sel.match}>
            <option value="">{sel.match ? "Selecciona mercado..." : "Primero selecciona partido"}</option>
            {(MARKETS[sport] || []).map(m => <option key={m} value={m} style={{ background: C.bgCard }}>{m}</option>)}
          </select>
        </>
      )}
    </div>
  );
};

// ── ANALIZAR ──────────────────────────────────────────────────────────────────
const AnalyzeTab = ({ onAnalysis, onSave }) => {
  const [mode, setMode] = useState("demanda");
  const [sels, setSels] = useState([{ sport: "Fútbol", league: "", match: "", market: "" }]);
  const [targetOdds, setTargetOdds] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const addSel = () => setSels([...sels, { sport: "Fútbol", league: "", match: "", market: "" }]);
  const delSel = (i) => setSels(sels.filter((_, idx) => idx !== i));
  const updSel = (i, f, v) => { const s = [...sels]; s[i][f] = v; setSels(s); };

  const canAnalyze = sels.every(s => s.match && (mode === "demanda" || s.market));

  const analyze = async () => {
    setLoading(true); setResult(null);
    try {
      const prompt = mode === "demanda"
        ? `Eres un analista experto en apuestas deportivas. Analiza en profundidad los siguientes partidos y genera la mejor recomendación de apuesta${targetOdds ? ` con cuota objetivo ${targetOdds}` : ""} en Bet365.

Partidos: ${JSON.stringify(sels.map(s => ({ match: s.match, sport: s.sport, league: s.league })))}

Analiza forma reciente, H2H, lesiones, motivación y valor real vs cuota Bet365. Si hay varios partidos genera una combinada.

Responde SOLO en JSON sin markdown:
{"type":"demanda","match":"partido o combinada","market":"mercado elegido","pick":"selección concreta","odds":número,"confidence":número1-100,"expectedValue":número,"analysis":"análisis detallado mínimo 300 palabras en español por secciones"}`
        : `Eres un analista experto en apuestas deportivas. Analiza los siguientes partidos con los mercados elegidos por el usuario y determina si tienen valor en Bet365.

Partidos: ${JSON.stringify(sels.map(s => ({ match: s.match, sport: s.sport, league: s.league, market: s.market })))}

Calcula probabilidad real vs implícita Bet365 para cada selección.

Responde SOLO en JSON sin markdown:
{"type":"demanda","match":"partido o combinada","market":"mercado","pick":"selección","odds":número estimado,"confidence":número,"expectedValue":número,"verdict":"VALOR|SIN VALOR|DUDOSO","analysis":"análisis mínimo 300 palabras en español"}`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      parsed.id = "d-" + Date.now(); parsed.date = today();
      setResult(parsed);
    } catch { setResult({ error: true }); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: "flex", background: C.bgCard, borderRadius: 10, padding: 4, marginBottom: 16 }}>
        {[["demanda", "La app genera"], ["propia", "Mi apuesta"]].map(([v, l]) => (
          <button key={v} onClick={() => { setMode(v); setResult(null); }} style={{
            flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
            background: mode === v ? C.green : "none", color: mode === v ? "#000" : C.grey2,
          }}>{l}</button>
        ))}
      </div>

      {sels.map((s, i) => (
        <MatchSelector key={i} index={i} sel={s} onUpdate={(f, v) => updSel(i, f, v)} onRemove={() => delSel(i)} showRemove={sels.length > 1} showMarket={mode === "propia"} />
      ))}

      <button onClick={addSel} style={{ width: "100%", background: "none", border: `1px dashed ${C.border}`, borderRadius: 10, padding: "12px 0", color: C.grey2, cursor: "pointer", marginBottom: 12, fontSize: 14 }}>
        + Añadir selección
      </button>

      {mode === "demanda" && (
        <div style={{ background: C.bgCard, borderRadius: 10, padding: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: C.grey2, fontSize: 13, whiteSpace: "nowrap" }}>Cuota objetivo</span>
          <input type="number" placeholder="Ej: 1.75 (opcional)" value={targetOdds} onChange={e => setTargetOdds(e.target.value)}
            style={{ flex: 1, background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.white, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
        </div>
      )}

      <button onClick={analyze} disabled={loading || !canAnalyze} style={{
        width: "100%", background: loading || !canAnalyze ? C.bgCardLight : C.green,
        border: "none", borderRadius: 10, padding: "15px 0",
        color: loading || !canAnalyze ? C.grey2 : "#000", fontWeight: 700, fontSize: 16, cursor: loading || !canAnalyze ? "not-allowed" : "pointer"
      }}>
        {loading ? <Spinner /> : !canAnalyze ? "Selecciona un partido primero" : "Analizar"}
      </button>

      {result && !result.error && (
        <div style={{ marginTop: 14, background: C.bgCard, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", background: C.green + "18", borderBottom: `1px solid ${C.green}33`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Pill type="demanda" />
            {result.verdict && <span style={{ fontSize: 11, fontWeight: 700, color: result.verdict === "VALOR" ? C.green : result.verdict === "SIN VALOR" ? C.red : C.yellow }}>{result.verdict}</span>}
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.white, fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{result.match}</div>
                <div style={{ color: C.green, fontSize: 13 }}>{result.market} · {result.pick}</div>
              </div>
              <OddsBadge value={result.odds} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div><div style={{ color: C.grey2, fontSize: 11, marginBottom: 5 }}>CONFIANZA</div><Confidence value={result.confidence} /></div>
              {result.expectedValue && <div style={{ textAlign: "right" }}><div style={{ color: C.grey2, fontSize: 11, marginBottom: 2 }}>VALOR ESP.</div><div style={{ color: C.green, fontWeight: 700, fontSize: 16 }}>+{result.expectedValue}%</div></div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onAnalysis(result)} style={{ flex: 1, background: C.bgCardLight, border: "none", borderRadius: 8, padding: "11px 0", color: C.green, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Ver análisis</button>
              <button onClick={() => onSave(result)} style={{ flex: 1, background: C.bgCardLight, border: "none", borderRadius: 8, padding: "11px 0", color: C.grey1, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
      {result?.error && <div style={{ marginTop: 12, color: C.red, textAlign: "center", fontSize: 14 }}>Error al analizar. Inténtalo de nuevo.</div>}
    </div>
  );
};

// ── REGISTRO ──────────────────────────────────────────────────────────────────
const RegisterTab = ({ register, setRegister, onAnalysis }) => {
  const [filter, setFilter] = useState("todas");
  const markResult = (id, result) => setRegister(r => r.map(b => b.id === id ? { ...b, result } : b));
  const markSelResult = (betId, si, result) => setRegister(r => r.map(b => {
    if (b.id !== betId) return b;
    const sels = b.selections.map((s, i) => i === si ? { ...s, result } : s);
    const all = sels.every(s => s.result);
    const overall = all ? (sels.every(s => s.result === "ganada") ? "ganada" : sels.some(s => s.result === "ganada") ? "parcial" : "perdida") : b.result;
    return { ...b, selections: sels, result: overall };
  }));
  const filtered = filter === "todas" ? register : register.filter(b => filter === "pendiente" ? !b.result : b.result === filter);
  const g = register.filter(b => b.result === "ganada").length;
  const p = register.filter(b => b.result === "perdida").length;
  const pct = (g + p) > 0 ? Math.round(g / (g + p) * 100) : 0;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
        {[{ l: "TOTAL", v: register.length, c: C.white }, { l: "GANAD.", v: g, c: C.green }, { l: "PERD.", v: p, c: C.red }, { l: "ACIERTO", v: `${pct}%`, c: C.yellow }].map(s => (
          <div key={s.l} style={{ background: C.bgCard, borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
            <div style={{ color: C.grey2, fontSize: 9, marginBottom: 3, letterSpacing: 0.5 }}>{s.l}</div>
            <div style={{ color: s.c, fontWeight: 700, fontSize: 20 }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        {[["todas", "Todas"], ["ganada", "Ganadas"], ["perdida", "Perdidas"], ["pendiente", "Pendientes"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ background: filter === v ? C.green : C.bgCard, color: filter === v ? "#000" : C.grey2, border: "none", borderRadius: 20, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState icon="📋" title="Sin apuestas aún" subtitle={filter === "todas" ? "Las apuestas que generes aparecerán aquí." : `No hay apuestas ${filter === "ganada" ? "ganadas" : filter === "perdida" ? "perdidas" : "pendientes"}.`} />}
      {filtered.map(bet => (
        <div key={bet.id} style={{ background: C.bgCard, borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Pill type={bet.type} /><span style={{ color: C.grey2, fontSize: 12 }}>{bet.date}</span></div>
            <ResultTag result={bet.result} />
          </div>
          <div style={{ padding: 16 }}>
            {bet.type === "soñadora" ? (
              <>
                {bet.selections?.map((s, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0" }}>
                      <div style={{ flex: 1 }}><div style={{ color: C.white, fontSize: 14, fontWeight: 600 }}>{s.match}</div><div style={{ color: C.grey2, fontSize: 12 }}>{s.pick} · {s.odds}</div></div>
                      <div style={{ display: "flex", gap: 5 }}>
                        {["ganada", "perdida"].map(r => (
                          <button key={r} onClick={() => markSelResult(bet.id, i, r)} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", fontSize: 14, background: s.result === r ? (r === "ganada" ? C.green : C.red) : C.bgCardLight, color: s.result === r ? "#000" : C.grey2 }}>{r === "ganada" ? "✓" : "✗"}</button>
                        ))}
                      </div>
                    </div>
                    {i < bet.selections.length - 1 && <Divider />}
                  </div>
                ))}
                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}><span style={{ color: C.grey2, fontSize: 13 }}>Cuota total</span><span style={{ color: C.yellow, fontWeight: 700 }}>{bet.totalOdds?.toFixed(2)}</span></div>
              </>
            ) : (
              <>
                <div style={{ color: C.white, fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{bet.match}</div>
                <div style={{ color: C.grey2, fontSize: 13, marginBottom: 12 }}>{bet.market} · Cuota {bet.odds}</div>
                {!bet.result && (
                  <div style={{ display: "flex", gap: 8 }}>
                    {["ganada", "perdida"].map(r => (
                      <button key={r} onClick={() => markResult(bet.id, r)} style={{ flex: 1, background: r === "ganada" ? C.green + "22" : C.red + "22", border: `1px solid ${r === "ganada" ? C.green + "55" : C.red + "55"}`, borderRadius: 8, padding: "10px 0", cursor: "pointer", color: r === "ganada" ? C.green : C.red, fontSize: 14, fontWeight: 600 }}>{r === "ganada" ? "✓ Ganada" : "✗ Perdida"}</button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}` }}>
            <button onClick={() => onAnalysis(bet)} style={{ width: "100%", background: "none", border: "none", padding: "11px 16px", color: C.grey2, fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
              <span>Ver análisis</span><span>›</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── ESTADÍSTICAS ──────────────────────────────────────────────────────────────
const StatsTab = ({ register }) => {
  const g = register.filter(b => b.result === "ganada").length;
  const p = register.filter(b => b.result === "perdida").length;
  const total = g + p;
  const pct = total > 0 ? Math.round(g / total * 100) : 0;
  const invested = register.reduce((a, b) => a + (parseFloat(b.stake) || 0), 0);
  const returned = register.reduce((a, b) => b.result !== "ganada" ? a : a + (parseFloat(b.stake) || 0) * (parseFloat(b.odds || b.totalOdds) || 1), 0);
  const roi = invested > 0 ? (((returned - invested) / invested) * 100).toFixed(1) : 0;
  const byType = {}; const byTypeG = {};
  register.forEach(b => { if (!b.type) return; byType[b.type] = (byType[b.type] || 0) + 1; if (b.result === "ganada") byTypeG[b.type] = (byTypeG[b.type] || 0) + 1; });
  if (register.length === 0) return <EmptyState icon="📊" title="Sin estadísticas aún" subtitle={"Empieza a registrar apuestas y aquí\nverás tu rendimiento en tiempo real."} />;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[{ l: "% ACIERTO", v: `${pct}%`, c: C.green }, { l: "ROI", v: `${roi}%`, c: parseFloat(roi) >= 0 ? C.green : C.red }, { l: "INVERTIDO", v: fmt(invested), c: C.white }, { l: "RETORNO", v: fmt(returned), c: "#7c9fff" }].map(s => (
          <div key={s.l} style={{ background: C.bgCard, borderRadius: 12, padding: 16 }}>
            <div style={{ color: C.grey2, fontSize: 11, letterSpacing: 0.6, marginBottom: 6 }}>{s.l}</div>
            <div style={{ color: s.c, fontWeight: 700, fontSize: 26 }}>{s.v}</div>
          </div>
        ))}
      </div>
      {Object.keys(byType).length > 0 && (
        <div style={{ background: C.bgCard, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div style={{ color: C.grey2, fontSize: 11, letterSpacing: 0.8, marginBottom: 14 }}>RENDIMIENTO POR TIPO</div>
          {Object.keys(byType).map(type => {
            const t = byType[type]; const gg = byTypeG[type] || 0; const pp = t > 0 ? Math.round(gg / t * 100) : 0;
            return (
              <div key={type} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: C.white, fontSize: 14, textTransform: "capitalize" }}>{type}</span>
                  <span style={{ color: C.grey2, fontSize: 13 }}>{gg}/{t} · <span style={{ color: C.green }}>{pp}%</span></span>
                </div>
                <div style={{ background: C.bgCardLight, borderRadius: 4, height: 5 }}>
                  <div style={{ background: C.green, borderRadius: 4, height: 5, width: `${pp}%`, transition: "width 0.6s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ background: C.bgCard, borderRadius: 12, padding: 16 }}>
        <div style={{ color: C.green, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>🧠 Lo que la IA ha aprendido</div>
        <div style={{ color: C.grey1, fontSize: 14, lineHeight: 1.7 }}>
          {total < 5 ? "Necesita al menos 5 apuestas para detectar patrones." : <>• Acierto global del {pct}% — {pct >= 55 ? "por encima de la media" : "margen de mejora"}.<br />• ROI {parseFloat(roi) >= 0 ? "positivo ✅" : "negativo, ajustando selecciones ⚠️"}.<br />• El modelo calibra su confianza con cada apuesta registrada.</>}
        </div>
      </div>
    </div>
  );
};

// ── AJUSTES ───────────────────────────────────────────────────────────────────
const SettingsTab = () => {
  const [risk, setRisk] = useState("equilibrado");
  const [sports, setSports] = useState(["Fútbol", "Tenis", "NBA", "NFL"]);
  const toggle = (s) => setSports(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  return (
    <div>
      <div style={{ background: C.bgCard, borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ color: C.grey2, fontSize: 11, letterSpacing: 0.8, marginBottom: 12 }}>PERFIL DE RIESGO</div>
        {[["conservador", "🛡️", "Conservador", "Stakes bajos, cuotas seguras"], ["equilibrado", "⚖️", "Equilibrado", "Balance entre valor y seguridad"], ["agresivo", "🎯", "Agresivo", "Busca valor oculto, cuotas altas"]].map(([v, icon, label, desc]) => (
          <button key={v} onClick={() => setRisk(v)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: risk === v ? C.green + "18" : C.bgCardLight, border: risk === v ? `1px solid ${C.green}44` : `1px solid transparent`, borderRadius: 10, padding: "13px 14px", marginBottom: 8, cursor: "pointer" }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <div><div style={{ color: risk === v ? C.green : C.white, fontWeight: 600, fontSize: 14 }}>{label}</div><div style={{ color: C.grey2, fontSize: 12 }}>{desc}</div></div>
          </button>
        ))}
      </div>
      <div style={{ background: C.bgCard, borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ color: C.grey2, fontSize: 11, letterSpacing: 0.8, marginBottom: 12 }}>DEPORTES ACTIVOS</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.keys(SPORTS_DATA).map(s => (
            <button key={s} onClick={() => toggle(s)} style={{ background: sports.includes(s) ? C.green : C.bgCardLight, color: sports.includes(s) ? "#000" : C.grey2, border: "none", borderRadius: 20, padding: "8px 16px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>{SPORTS_DATA[s].icon} {s}</button>
          ))}
        </div>
      </div>
      <div style={{ background: C.bgCard, borderRadius: 12, padding: 16 }}>
        <div style={{ color: C.grey2, fontSize: 11, letterSpacing: 0.8, marginBottom: 12 }}>FILOSOFÍA APOSTADORA</div>
        {["Seguridad como base", "Búsqueda de valor oculto", "Gestión de bankroll inteligente", "Ajuste automático por racha"].map(f => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
            <span style={{ color: C.white, fontSize: 14 }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("inicio");
  const [budget, setBudget] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [register, setRegister] = useState([]);
  const [modal, setModal] = useState(null);
  const [dailyBet, setDailyBet] = useState(null);
  const [dreamBet, setDreamBet] = useState(null);
  const [loadingBets, setLoadingBets] = useState(false);

  const streak = (() => {
    if (register.length === 0) return 0;
    let s = 0;
    const sorted = [...register].filter(b => b.result).sort((a, b) => b.id.localeCompare(a.id));
    for (const b of sorted) { if (b.result === "ganada") s++; else if (b.result === "perdida") { s = s > 0 ? s : s - 1; break; } }
    return s;
  })();

  const generateBets = async () => {
    setLoadingBets(true); setDailyBet(null); setDreamBet(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: `Eres un analista experto en apuestas deportivas. Hoy es ${today()}. Genera DOS apuestas reales para hoy en Bet365 en fútbol, tenis, NBA o NFL.

1. DIARIA: cuota entre 1.50-1.80, alta probabilidad, partido único
2. SOÑADORA: combinada de 3-4 selecciones con cuota total entre 8-11

Responde SOLO en JSON sin markdown:
{"daily":{"match":"partido","league":"liga","sport":"deporte","market":"mercado","pick":"selección","odds":número,"confidence":número,"analysis":"análisis 200 palabras"},"dream":{"selections":[{"match":"partido","sport":"deporte","league":"liga","pick":"selección","odds":número}],"analysis":"análisis 200 palabras"}}` }]
        })
      });
      const data = await res.json();
      const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const totalOdds = parsed.dream.selections.reduce((a, s) => a * s.odds, 1);
      setDailyBet({ ...parsed.daily, id: "daily-" + Date.now(), type: "diaria", date: today(), result: null });
      setDreamBet({ ...parsed.dream, id: "dream-" + Date.now(), type: "soñadora", date: today(), totalOdds, result: null });
    } catch { }
    setLoadingBets(false);
  };

  const saveToRegister = (bet) => { setRegister(prev => [{ ...bet, stake: distribution?.demanda }, ...prev]); setTab("registro"); };

  const TABS = [{ id: "inicio", icon: "⌂", label: "Inicio" }, { id: "analizar", icon: "◎", label: "Analizar" }, { id: "registro", icon: "☰", label: "Registro" }, { id: "stats", icon: "▲", label: "Stats" }, { id: "ajustes", icon: "◈", label: "Ajustes" }];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.white, fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif", maxWidth: 480, margin: "0 auto", paddingBottom: 72 }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } input, select, textarea, button { font-family: inherit; } ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: ${C.bg}; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; } @keyframes b365pulse { 0%,100%{opacity:.3;transform:scale(.7)} 50%{opacity:1;transform:scale(1)} } input::placeholder, textarea::placeholder { color: ${C.grey3}; } select option { background: ${C.bgCard}; color: ${C.white}; }`}</style>

      <div style={{ background: "#13151a", borderBottom: `1px solid ${C.border}`, padding: "14px 18px", position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: C.green, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: "#000" }}>B</div>
          <div><div style={{ color: C.white, fontWeight: 700, fontSize: 17 }}>BetAnalysis</div><div style={{ color: C.green, fontSize: 10, letterSpacing: 1 }}>POWERED BY AI</div></div>
        </div>
        <div style={{ background: C.bgCard, borderRadius: 20, padding: "6px 14px", border: `1px solid ${C.border}` }}>
          <span style={{ color: C.white, fontSize: 13, fontWeight: 600 }}>{today()}</span>
        </div>
      </div>

      <div style={{ padding: 14 }}>
        {tab === "inicio" && <HomeTab budget={budget} setBudget={setBudget} distribution={distribution} setDistribution={setDistribution} onAnalysis={setModal} dailyBet={dailyBet} dreamBet={dreamBet} loadingBets={loadingBets} generateBets={generateBets} streak={streak} />}
        {tab === "analizar" && <AnalyzeTab onAnalysis={setModal} onSave={saveToRegister} />}
        {tab === "registro" && <RegisterTab register={register} setRegister={setRegister} onAnalysis={setModal} />}
        {tab === "stats" && <StatsTab register={register} />}
        {tab === "ajustes" && <SettingsTab />}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#13151a", borderTop: `1px solid ${C.border}`, display: "flex" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "none", border: "none", padding: "10px 0 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 20, color: tab === t.id ? C.green : C.grey2 }}>{t.icon}</span>
            <span style={{ fontSize: 9, color: tab === t.id ? C.green : C.grey2, fontWeight: tab === t.id ? 700 : 400, letterSpacing: 0.4 }}>{t.label.toUpperCase()}</span>
          </button>
        ))}
      </div>

      <AnalysisModal bet={modal} onClose={() => setModal(null)} />
    </div>
  );
}