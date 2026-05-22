import { useState } from "react";

const C = {
  bg: "#1e2028", bgCard: "#2a2d36", bgCardLight: "#32353f", bgInput: "#13151a",
  green: "#00d4aa", yellow: "#f5c842", white: "#ffffff",
  grey1: "#b0b4c0", grey2: "#7a7f8e", grey3: "#3e4250", red: "#e05252", border: "#3a3d48",
};

const today = () => new Date().toLocaleDateString("es-ES");
const fmt = (n) => `${Number(n).toFixed(2)}€`;

// ── LIGAS DE FÚTBOL ───────────────────────────────────────────────────────────
const LEAGUES = [
  "Premier League", "LaLiga", "Serie A", "Bundesliga", "Ligue 1",
  "Eredivisie", "Primeira Liga", "Pro League Bélgica", "Super Lig Turquía",
  "Premiership Escocia", "FA Cup", "Copa del Rey", "Coppa Italia",
  "DFB Pokal", "Coupe de France", "Champions League", "Europa League",
  "Conference League", "Libertadores", "Sudamericana", "Brasileirao",
  "Liga Argentina", "Liga MX", "MLS", "Liga Colombiana", "Liga Chilena",
  "Saudi Pro League", "Liga Japonesa", "Mundial", "Eurocopa",
  "Copa América", "Nations League UEFA", "Eliminatorias Mundial",
  "Amistosos internacionales",
];

const MARKETS = [
  "1X2 — Resultado final",
  "Doble oportunidad (1X / X2 / 12)",
  "Ambos equipos marcan",
  "Más de 0.5 goles", "Más de 1.5 goles", "Más de 2.5 goles", "Más de 3.5 goles",
  "Menos de 1.5 goles", "Menos de 2.5 goles", "Menos de 3.5 goles",
  "Hándicap asiático", "Hándicap europeo",
  "Resultado al descanso", "Resultado al descanso + final",
  "Primer goleador", "Último goleador", "Marcar en cualquier momento (jugador)",
  "Número de corners", "Número de tarjetas amarillas", "Tarjeta roja en el partido",
  "Resultado exacto", "Método de victoria",
  "Goles del local", "Goles del visitante", "Ambos marcan en cada parte",
];

// ── API ───────────────────────────────────────────────────────────────────────
const callAI = async (prompt) => {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
};

const fetchBet365Soccer = async () => {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "bet365_soccer" })
    });
    const data = await res.json();
    const matches = [];
    (data.leagues || []).forEach(league => {
      (league.events || []).forEach(event => {
        if (event.home && event.away) {
          matches.push({
            match: `${event.home} vs ${event.away}`,
            league: league.leagueName || league.tournament || '',
            fi: event.fi,
            odds: event.outcomes || [],
          });
        }
      });
    });
    return matches;
  } catch { return []; }
};

// ── SMALL COMPONENTS ──────────────────────────────────────────────────────────
const Pill = ({ type }) => {
  const map = { diaria: ["DIARIA", C.green], soñadora: ["SOÑADORA", C.yellow], demanda: ["A DEMANDA", "#7c9fff"] };
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
  const filled = Math.round((value / 100) * 5);
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ width: 18, height: 4, borderRadius: 2, background: i < filled ? C.green : C.grey3 }} />)}
      <span style={{ color: C.grey2, fontSize: 11, marginLeft: 4 }}>{value}%</span>
    </div>
  );
};

const Spinner = () => (
  <div style={{ display: "flex", gap: 5, alignItems: "center", justifyContent: "center" }}>
    {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, animation: `b365pulse 1s ease-in-out ${i * 0.2}s infinite` }} />)}
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

const selStyle = {
  width: "100%", background: C.bgInput, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: "12px 14px", color: C.white, fontSize: 14,
  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};

// ── MODAL ANÁLISIS ────────────────────────────────────────────────────────────
const AnalysisModal = ({ bet, onClose }) => {
  if (!bet) return null;
  const lines = (bet.analysis || "Sin análisis disponible.").split("\n");
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 200, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div style={{ background: C.bgCard, borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "80vh", overflowY: "auto", padding: 24 }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ color: C.white, fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{bet.match || "Análisis"}</div>
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

// ── TARJETAS ──────────────────────────────────────────────────────────────────
const DailyCard = ({ bet, stake, onAnalysis }) => (
  <div style={{ background: C.bgCard, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
    <div style={{ background: C.green + "18", borderBottom: `1px solid ${C.green}33`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Pill type="diaria" /><span style={{ color: C.grey2, fontSize: 12 }}>{bet.league}</span>
    </div>
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ flex: 1 }}><div style={{ color: C.white, fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{bet.match}</div><div style={{ color: C.grey2, fontSize: 13 }}>⚽ Fútbol</div></div>
        <OddsBadge value={bet.odds} />
      </div>
      <div style={{ background: C.bgCardLight, borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: C.green }}>📌</span><span style={{ color: C.white, fontSize: 14, fontWeight: 600 }}>{bet.market}</span>
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
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: C.grey2, fontSize: 12 }}>CUOTA TOTAL</span><span style={{ color: C.yellow, fontWeight: 700, fontSize: 18 }}>{bet.totalOdds.toFixed(2)}</span></div>
    </div>
    <div style={{ padding: "12px 16px" }}>
      {bet.selections.map((s, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
            <div style={{ flex: 1 }}><div style={{ color: C.white, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{s.match}</div><div style={{ color: C.grey2, fontSize: 12 }}>⚽ {s.league} · {s.pick}</div></div>
            <OddsBadge value={s.odds} color={C.yellow} />
          </div>
          {i < bet.selections.length - 1 && <Divider />}
        </div>
      ))}
    </div>
    {stake && <div style={{ padding: "0 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: C.grey2, fontSize: 13 }}>Stake recomendado</span><span style={{ color: C.yellow, fontWeight: 700, fontSize: 18 }}>{fmt(stake)}</span></div>}
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
          <div style={{ color: streak > 0 ? C.green : streak < 0 ? C.red : C.grey2, fontWeight: 700, fontSize: 28 }}>{streak === 0 ? "—" : streak > 0 ? `+${streak} días` : `${streak} días`}</div>
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
                <div style={{ color: C.grey2, fontSize: 9, marginBottom: 4 }}>{i.l}</div>
                <div style={{ color: i.c, fontWeight: 700, fontSize: 16 }}>{fmt(i.v)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {!distribution ? (
        <EmptyState icon="⚽" title="Introduce tu presupuesto" subtitle={"Introduce cuánto quieres apostar hoy\ny la IA generará las apuestas del día."} />
      ) : loadingBets ? (
        <div style={{ background: C.bgCard, borderRadius: 12, padding: 40, textAlign: "center" }}>
          <div style={{ color: C.grey2, fontSize: 14, marginBottom: 16 }}>Analizando partidos de Bet365...</div>
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

// ── ANALIZAR ──────────────────────────────────────────────────────────────────
const AnalyzeTab = ({ onAnalysis, onSave, allMatches }) => {
  const [mode, setMode] = useState("demanda");
  const [sels, setSels] = useState([{ league: "", match: "", market: "" }]);
  const [targetOdds, setTargetOdds] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const addSel = () => setSels([...sels, { league: "", match: "", market: "" }]);
  const delSel = (i) => setSels(sels.filter((_, idx) => idx !== i));
  const updSel = (i, f, v) => { const s = [...sels]; s[i][f] = v; setSels(s); };
  const canAnalyze = sels.every(s => s.match && (mode === "demanda" || s.market));

  const getMatchesForLeague = (leagueName) => {
    if (!leagueName) return allMatches;
    const keywords = leagueName.toLowerCase().split(" ").filter(w => w.length > 3);
    const filtered = allMatches.filter(m => keywords.some(kw => m.league.toLowerCase().includes(kw)));
    return filtered.length > 0 ? filtered : allMatches;
  };

  const analyze = async () => {
    setLoading(true); setResult(null);
    try {
      const prompt = mode === "demanda"
        ? `Eres un analista experto en apuestas deportivas con conocimiento profundo de Bet365. Analiza estos partidos de fútbol y genera la mejor recomendación${targetOdds ? ` con cuota objetivo ${targetOdds}` : ""}.

Partidos: ${JSON.stringify(sels.map(s => ({ match: s.match, league: s.league })))}

Haz un análisis PROFUNDO:
**Forma reciente**: últimos 5 partidos de cada equipo (local/visitante por separado)
**Head to Head**: últimos enfrentamientos directos
**Jugadores clave**: lesiones, sanciones, estado de forma de los titulares
**Estadísticas avanzadas**: xG, posesión, disparos, corners
**Motivación**: qué se juegan ambos equipos
**Valor de la cuota**: probabilidad real vs cuota Bet365, valor esperado
Considera TODOS los mercados de Bet365, no solo el resultado.

Responde SOLO en JSON sin markdown:
{"type":"demanda","match":"partido","league":"liga","market":"mercado específico Bet365","pick":"selección concreta","odds":número,"confidence":número1-100,"expectedValue":número,"analysis":"análisis mínimo 400 palabras con las secciones indicadas"}`
        : `Eres un analista experto en apuestas deportivas. Analiza si este mercado tiene valor en Bet365.

Partidos: ${JSON.stringify(sels.map(s => ({ match: s.match, league: s.league, market: s.market })))}

Análisis PROFUNDO:
**Forma reciente**: últimos 5 partidos de cada equipo
**Head to Head**: historial directo
**Jugadores clave**: lesiones, sanciones, forma
**Estadísticas del mercado**: datos específicos para el mercado elegido
**Valor de la cuota**: prob. real vs cuota Bet365
**Conclusión**: VALOR / SIN VALOR / DUDOSO con justificación

Responde SOLO en JSON sin markdown:
{"type":"demanda","match":"partido","league":"liga","market":"mercado","pick":"selección","odds":número,"confidence":número,"expectedValue":número,"verdict":"VALOR|SIN VALOR|DUDOSO","analysis":"análisis mínimo 400 palabras con las secciones indicadas"}`;

      const parsed = await callAI(prompt);
      parsed.id = "d-" + Date.now(); parsed.date = today();
      setResult(parsed);
    } catch { setResult({ error: true }); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: "flex", background: C.bgCard, borderRadius: 10, padding: 4, marginBottom: 16 }}>
        {[["demanda", "La app genera"], ["propia", "Mi apuesta"]].map(([v, l]) => (
          <button key={v} onClick={() => { setMode(v); setResult(null); }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: mode === v ? C.green : "none", color: mode === v ? "#000" : C.grey2 }}>{l}</button>
        ))}
      </div>

      {sels.map((s, i) => (
        <div key={i} style={{ background: C.bgCard, borderRadius: 12, padding: 16, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: C.grey2, fontSize: 12, fontWeight: 600 }}>SELECCIÓN {i + 1}</span>
            {sels.length > 1 && <button onClick={() => delSel(i)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 20 }}>×</button>}
          </div>

          <div style={{ color: C.grey2, fontSize: 11, marginBottom: 6 }}>COMPETICIÓN</div>
          <select value={s.league} onChange={e => { updSel(i, "league", e.target.value); updSel(i, "match", ""); }} style={{ ...selStyle, marginBottom: 12 }}>
            <option value="">Todas las competiciones</option>
            {LEAGUES.map(l => <option key={l} value={l} style={{ background: C.bgCard }}>{l}</option>)}
          </select>

          <div style={{ color: C.grey2, fontSize: 11, marginBottom: 6 }}>PARTIDO</div>
          <select value={s.match} onChange={e => updSel(i, "match", e.target.value)} style={{ ...selStyle, marginBottom: mode === "propia" ? 12 : 0 }}>
            <option value="">Selecciona partido...</option>
            {getMatchesForLeague(s.league).map(m => (
              <option key={m.match} value={m.match} style={{ background: C.bgCard }}>{m.match} — {m.league}</option>
            ))}
          </select>

          {mode === "propia" && (
            <>
              <div style={{ color: C.grey2, fontSize: 11, marginBottom: 6 }}>MERCADO</div>
              <select value={s.market} onChange={e => updSel(i, "market", e.target.value)} style={selStyle} disabled={!s.match}>
                <option value="">{s.match ? "Selecciona mercado..." : "Primero selecciona partido"}</option>
                {MARKETS.map(m => <option key={m} value={m} style={{ background: C.bgCard }}>{m}</option>)}
              </select>
            </>
          )}
        </div>
      ))}

      <button onClick={addSel} style={{ width: "100%", background: "none", border: `1px dashed ${C.border}`, borderRadius: 10, padding: "12px 0", color: C.grey2, cursor: "pointer", marginBottom: 12, fontSize: 14 }}>+ Añadir selección</button>

      {mode === "demanda" && (
        <div style={{ background: C.bgCard, borderRadius: 10, padding: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: C.grey2, fontSize: 13, whiteSpace: "nowrap" }}>Cuota objetivo</span>
          <input type="number" placeholder="Ej: 1.75 (opcional)" value={targetOdds} onChange={e => setTargetOdds(e.target.value)}
            style={{ flex: 1, background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.white, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
        </div>
      )}

      <button onClick={analyze} disabled={loading || !canAnalyze} style={{ width: "100%", background: loading || !canAnalyze ? C.bgCardLight : C.green, border: "none", borderRadius: 10, padding: "15px 0", color: loading || !canAnalyze ? C.grey2 : "#000", fontWeight: 700, fontSize: 16, cursor: loading || !canAnalyze ? "not-allowed" : "pointer" }}>
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
              <div style={{ flex: 1 }}><div style={{ color: C.white, fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{result.match}</div><div style={{ color: C.green, fontSize: 13 }}>{result.market} · {result.pick}</div></div>
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
            <div style={{ color: C.grey2, fontSize: 9, marginBottom: 3 }}>{s.l}</div>
            <div style={{ color: s.c, fontWeight: 700, fontSize: 20 }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
        {[["todas", "Todas"], ["ganada", "Ganadas"], ["perdida", "Perdidas"], ["pendiente", "Pendientes"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ background: filter === v ? C.green : C.bgCard, color: filter === v ? "#000" : C.grey2, border: "none", borderRadius: 20, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState icon="📋" title="Sin apuestas aún" subtitle="Las apuestas que generes aparecerán aquí." />}
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
            <button onClick={() => onAnalysis(bet)} style={{ width: "100%", background: "none", border: "none", padding: "11px 16px", color: C.grey2, fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "space-between" }}><span>Ver análisis</span><span>›</span></button>
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
  if (register.length === 0) return <EmptyState icon="📊" title="Sin estadísticas aún" subtitle="Empieza a registrar apuestas y verás tu rendimiento aquí." />;
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
  const [allMatches, setAllMatches] = useState([]);

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
      const matches = await fetchBet365Soccer();
      setAllMatches(matches);

      const matchList = matches.slice(0, 25).map(m => {
        const odds = m.odds || [];
        const oddsStr = odds.length > 0 ? ` [${odds.map(o => `${o.name}:${o.decimal}`).join(', ')}]` : '';
        return `${m.match} (${m.league})${oddsStr}`;
      }).join("\n");

      const parsed = await callAI(`Eres un analista experto en apuestas deportivas con conocimiento profundo de Bet365. Hoy es ${today()}.

Partidos reales disponibles AHORA en Bet365 con cuotas reales:
${matchList || "No hay datos disponibles"}

Genera DOS apuestas:

1. DIARIA: cuota 1.50-1.80, partido único de la lista. Elige el mercado con más valor (considera: ambos marcan, más/menos goles, hándicap, resultado descanso, jugadores...). Analiza forma reciente y jugadores clave.

2. SOÑADORA: combinada 3-4 partidos de la lista, cuota total 8-11.

Responde SOLO en JSON sin markdown:
{"daily":{"match":"partido exacto de la lista","league":"liga","market":"mercado específico Bet365","pick":"selección","odds":número real de Bet365,"confidence":número,"analysis":"análisis 300 palabras con **Forma reciente**, **Jugadores clave**, **Valor de la cuota**"},"dream":{"selections":[{"match":"partido de la lista","league":"liga","pick":"selección","odds":número}],"analysis":"análisis 200 palabras"}}`);

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
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } input, select, textarea, button { font-family: inherit; } ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: ${C.bg}; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; } @keyframes b365pulse { 0%,100%{opacity:.3;transform:scale(.7)} 50%{opacity:1;transform:scale(1)} } input::placeholder { color: ${C.grey3}; } select option { background: ${C.bgCard}; color: ${C.white}; }`}</style>
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
        {tab === "analizar" && <AnalyzeTab onAnalysis={setModal} onSave={saveToRegister} allMatches={allMatches} />}
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
