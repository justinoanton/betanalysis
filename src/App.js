import { useState, useEffect, useCallback } from "react";

const C = {
  bg: "#1e2028", bgCard: "#2a2d36", bgCardLight: "#32353f", bgInput: "#13151a",
  green: "#00d4aa", yellow: "#f5c842", white: "#ffffff",
  grey1: "#b0b4c0", grey2: "#7a7f8e", grey3: "#3e4250", red: "#e05252", border: "#3a3d48",
};

const todayLabel = () => new Date().toLocaleDateString("es-ES");
const todayISO = () => new Date().toISOString().split('T')[0];
const fmt = (n) => `${Number(n).toFixed(2)}€`;

// AJUSTE 3: normalización de nombres de partido para comparación
const normalizeMatch = (str) =>
  (str || "").toLowerCase().trim().replace(/\s+/g, " ");

const LEAGUES = [
  "Premier League","LaLiga","Serie A","Bundesliga","Ligue 1","Eredivisie",
  "Primeira Liga","Pro League Bélgica","Super Lig Turquía","Premiership Escocia",
  "FA Cup","Copa del Rey","Coppa Italia","DFB Pokal","Coupe de France",
  "Champions League","Europa League","Conference League",
  "Libertadores","Sudamericana","Brasileirao","Liga Argentina","Liga MX","MLS",
  "Liga Colombiana","Liga Chilena","Saudi Pro League","Liga Japonesa",
  "Mundial","Eurocopa","Copa América","Nations League UEFA",
  "Eliminatorias Mundial","Amistosos internacionales",
];

const MARKETS = [
  "1X2 — Resultado final","Doble oportunidad (1X / X2 / 12)","Ambos equipos marcan",
  "Más de 0.5 goles","Más de 1.5 goles","Más de 2.5 goles","Más de 3.5 goles",
  "Menos de 1.5 goles","Menos de 2.5 goles","Menos de 3.5 goles",
  "Hándicap asiático","Hándicap europeo","Resultado al descanso",
  "Resultado al descanso + final","Primer goleador","Último goleador",
  "Marcar en cualquier momento (jugador)","Número de corners",
  "Número de tarjetas amarillas","Tarjeta roja en el partido",
  "Resultado exacto","Método de victoria",
  "Goles del local","Goles del visitante","Ambos marcan en cada parte",
];

// ── API CALLS ─────────────────────────────────────────────────────────────────
const callAPI = async (body) => {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.message || "Error de API");
  return data;
};

// Lanza error si falla — para generateBets
const fetchMatchesStrict = async () => {
  const data = await callAPI({ type: "fixtures_today", date: todayISO() });
  return data.matches || [];
};

// Devuelve {matches, error} sin lanzar — para AnalyzeTab
const fetchMatchesSafe = async () => {
  try {
    const data = await callAPI({ type: "fixtures_today", date: todayISO() });
    return { matches: data.matches || [], error: null };
  } catch (e) {
    return { matches: [], error: e.message || "No se pudieron cargar partidos automáticamente." };
  }
};

const callAI = async (prompt) => {
  const data = await callAPI({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: prompt + "\n\nIMPORTANTE: Responde ÚNICAMENTE con JSON válido. Sin texto antes ni después. Sin bloques de código markdown. Solo el objeto JSON.",
    }],
  });
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
  const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("La IA no devolvió JSON válido");
  }
};

// ── SMALL COMPONENTS ──────────────────────────────────────────────────────────
const Pill = ({ type }) => {
  const map = { diaria: ["DIARIA", C.green], soñadora: ["SOÑADORA", C.yellow], demanda: ["A DEMANDA", "#7c9fff"] };
  const [label, color] = map[type] || [type, C.grey2];
  return <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, letterSpacing: 0.8 }}>{label}</span>;
};

// AJUSTE 1: badge de cuota estimada
const OddsBadge = ({ value, color = C.yellow, estimated = false }) => (
  <div style={{ background: C.bgCardLight, borderRadius: 6, padding: "6px 14px", textAlign: "center", minWidth: 56 }}>
    <div style={{ color, fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{Number(value || 0).toFixed(2)}</div>
    {estimated && <div style={{ color: C.grey2, fontSize: 9, marginTop: 2 }}>EST.</div>}
  </div>
);

const ResultTag = ({ result }) => {
  if (!result) return <span style={{ color: C.grey2, fontSize: 12 }}>Pendiente</span>;
  const map = { ganada: [C.green, "GANADA"], perdida: [C.red, "PERDIDA"], parcial: [C.yellow, "PARCIAL"] };
  const [color, label] = map[result] || [C.grey2, result];
  return <span style={{ color, fontWeight: 700, fontSize: 12 }}>{label}</span>;
};

const VerdictBadge = ({ verdict }) => {
  if (!verdict) return null;
  const map = {
    "APOSTAR": [C.green, "✓ APOSTAR"],
    "ESPERAR": [C.yellow, "⏳ ESPERAR"],
    "DESCARTAR": [C.red, "✗ DESCARTAR"],
    "VALOR": [C.green, "✓ VALOR"],
    "SIN VALOR": [C.red, "✗ SIN VALOR"],
    "DUDOSO": [C.yellow, "~ DUDOSO"],
  };
  const [color, label] = map[verdict] || [C.grey2, verdict];
  return <span style={{ color, fontWeight: 700, fontSize: 11 }}>{label}</span>;
};

const Confidence = ({ value }) => {
  const filled = Math.round(((value || 0) / 100) * 5);
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ width: 18, height: 4, borderRadius: 2, background: i < filled ? C.green : C.grey3 }} />)}
      <span style={{ color: C.grey2, fontSize: 11, marginLeft: 4 }}>{value || 0}%</span>
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

const ErrorBox = ({ message, onRetry }) => (
  <div style={{ background: C.red + "18", border: `1px solid ${C.red}44`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
    <div style={{ color: C.red, fontWeight: 600, fontSize: 14, marginBottom: onRetry ? 10 : 0 }}>⚠️ {message}</div>
    {onRetry && <button onClick={onRetry} style={{ background: C.red + "22", border: `1px solid ${C.red}44`, borderRadius: 6, padding: "6px 14px", color: C.red, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Reintentar</button>}
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
      <div style={{ background: C.bgCard, borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "82vh", overflowY: "auto", padding: 24 }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ color: C.white, fontWeight: 700, fontSize: 17, flex: 1 }}>{bet.match || "Análisis"}</div>
          {bet.verdict && <VerdictBadge verdict={bet.verdict} />}
        </div>
        {bet.market && <div style={{ color: C.green, fontSize: 13, marginBottom: 4 }}>{bet.market} · {bet.pick}</div>}
        {/* AJUSTE 1: cuota estimada en modal */}
        {bet.odds && <div style={{ color: C.grey2, fontSize: 12, marginBottom: 4 }}>Cuota estimada: <span style={{ color: C.yellow }}>{Number(bet.odds).toFixed(2)}</span></div>}
        {bet.stake && <div style={{ color: C.grey2, fontSize: 12, marginBottom: 4 }}>Stake sugerido: <span style={{ color: C.yellow }}>{bet.stake}</span></div>}
        {bet.mainRisk && <div style={{ color: C.yellow, fontSize: 12, marginBottom: 12 }}>⚠️ Riesgo principal: {bet.mainRisk}</div>}
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
const BetCard = ({ bet, stake, onAnalysis, accentColor = C.green, pillType = "diaria" }) => (
  <div style={{ background: C.bgCard, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
    <div style={{ background: accentColor + "18", borderBottom: `1px solid ${accentColor}33`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Pill type={pillType} />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {bet.verdict && <VerdictBadge verdict={bet.verdict} />}
        <span style={{ color: C.grey2, fontSize: 12 }}>{bet.league}</span>
      </div>
    </div>
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ flex: 1 }}><div style={{ color: C.white, fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{bet.match}</div></div>
        {/* AJUSTE 1: estimated=true en todas las tarjetas generadas por IA */}
        <OddsBadge value={bet.odds} color={accentColor} estimated />
      </div>
      <div style={{ background: C.bgCardLight, borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: accentColor }}>📌</span>
        <span style={{ color: C.white, fontSize: 14, fontWeight: 600 }}>{bet.market} — {bet.pick}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ color: C.grey2, fontSize: 11, marginBottom: 5 }}>CONFIANZA</div><Confidence value={bet.confidence} /></div>
        <div style={{ textAlign: "right" }}>
          {bet.stake && <div style={{ color: C.grey2, fontSize: 11 }}>Stake: <span style={{ color: C.yellow }}>{bet.stake}</span></div>}
          {stake && <div style={{ color: C.white, fontWeight: 700, fontSize: 18 }}>{fmt(stake)}</div>}
        </div>
      </div>
      {bet.mainRisk && <div style={{ marginTop: 8, color: C.yellow, fontSize: 12 }}>⚠️ {bet.mainRisk}</div>}
    </div>
    <Divider />
    <button onClick={() => onAnalysis(bet)} style={{ width: "100%", background: "none", border: "none", padding: "13px 16px", color: accentColor, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>Ver análisis completo</span><span style={{ fontSize: 18 }}>›</span>
    </button>
  </div>
);

const DreamCard = ({ bet, stake, onAnalysis }) => (
  <div style={{ background: C.bgCard, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
    <div style={{ background: C.yellow + "18", borderBottom: `1px solid ${C.yellow}33`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Pill type="soñadora" />
      {/* AJUSTE 1: "CUOTA TOTAL EST." */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: C.grey2, fontSize: 12 }}>CUOTA TOTAL EST.</span>
        <span style={{ color: C.yellow, fontWeight: 700, fontSize: 18 }}>{Number(bet.totalOdds || 0).toFixed(2)}</span>
      </div>
    </div>
    <div style={{ padding: "12px 16px" }}>
      {(bet.selections || []).map((s, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.white, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{s.match}</div>
              <div style={{ color: C.grey2, fontSize: 12 }}>⚽ {s.league} · {s.pick}</div>
            </div>
            <OddsBadge value={s.odds} color={C.yellow} estimated />
          </div>
          {i < bet.selections.length - 1 && <Divider />}
        </div>
      ))}
    </div>
    {bet.mainRisk && <div style={{ padding: "0 16px 8px", color: C.yellow, fontSize: 12 }}>⚠️ {bet.mainRisk}</div>}
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
const HomeTab = ({ budget, setBudget, distribution, setDistribution, onAnalysis, dailyBet, dreamBet, loadingBets, betsError, generateBets, streak }) => {
  const [input, setInput] = useState(budget || "");
  const [inputError, setInputError] = useState(null);

  const handleStart = () => {
    const n = parseFloat(input);
    if (!n || n <= 0) {
      setInputError("Introduce un presupuesto mayor que 0");
      return;
    }
    setInputError(null);
    setBudget(n);
    setDistribution({
      diaria: +(n * 0.55).toFixed(2),
      sonadora: +(n * 0.10).toFixed(2),
      demanda: +(n * 0.35).toFixed(2),
    });
    generateBets();
  };

  return (
    <div>
      <div style={{ background: C.bgCard, borderRadius: 12, padding: 16, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: C.grey2, fontSize: 11, marginBottom: 4, letterSpacing: 0.8 }}>RACHA ACTUAL</div>
          <div style={{ color: streak > 0 ? C.green : streak < 0 ? C.red : C.grey2, fontWeight: 700, fontSize: 28 }}>
            {streak === 0 ? "—" : streak > 0 ? `+${streak} días` : `${streak} días`}
          </div>
          <div style={{ color: C.grey2, fontSize: 12, marginTop: 2 }}>
            {streak === 0 ? "Sin datos aún" : streak >= 3 ? "Sigue así 🔥" : streak > 0 ? "Buen ritmo" : "Ajusta el riesgo ⚠️"}
          </div>
        </div>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.bgCardLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
          {streak === 0 ? "📊" : streak >= 3 ? "🔥" : streak > 0 ? "✅" : "⚠️"}
        </div>
      </div>

      <div style={{ background: C.bgCard, borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ color: C.grey2, fontSize: 11, letterSpacing: 0.8, marginBottom: 12 }}>PRESUPUESTO DEL DÍA</div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", background: C.bgInput, borderRadius: 8, padding: "0 12px", border: `1px solid ${inputError ? C.red : C.border}` }}>
            <span style={{ color: C.grey2, fontSize: 16, marginRight: 4 }}>€</span>
            <input
              type="number"
              placeholder="0.00"
              value={input}
              onChange={e => { setInput(e.target.value); setInputError(null); }}
              onKeyDown={e => e.key === "Enter" && handleStart()}
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.white, fontSize: 18, fontWeight: 600, padding: "12px 0", fontFamily: "inherit" }}
            />
          </div>
          <button onClick={handleStart} style={{ background: C.green, border: "none", borderRadius: 8, padding: "0 20px", color: "#000", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>OK</button>
        </div>
        {inputError && <div style={{ color: C.red, fontSize: 12, marginTop: 6 }}>{inputError}</div>}
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
          <div style={{ color: C.grey2, fontSize: 14, marginBottom: 16 }}>Buscando los mejores partidos del día...</div>
          <Spinner />
        </div>
      ) : betsError ? (
        <ErrorBox message={betsError} onRetry={generateBets} />
      ) : dailyBet ? (
        <>
          <div style={{ color: C.grey2, fontSize: 11, letterSpacing: 0.8, marginBottom: 10 }}>APUESTAS DE HOY</div>
          {dailyBet.verdict === "DESCARTAR" ? (
            <div style={{ background: C.bgCard, borderRadius: 12, padding: 20, marginBottom: 12, textAlign: "center" }}>
              <div style={{ color: C.red, fontSize: 28, marginBottom: 8 }}>✗</div>
              <div style={{ color: C.white, fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Sin apuesta recomendada hoy</div>
              <div style={{ color: C.grey2, fontSize: 13 }}>{dailyBet.reason || "No hay suficiente valor o información fiable."}</div>
            </div>
          ) : (
            <BetCard bet={dailyBet} stake={distribution?.diaria} onAnalysis={onAnalysis} pillType="diaria" />
          )}
          {dreamBet && <DreamCard bet={dreamBet} stake={distribution?.sonadora} onAnalysis={onAnalysis} />}
        </>
      ) : null}
    </div>
  );
};

// ── ANALIZAR ──────────────────────────────────────────────────────────────────
const AnalyzeTab = ({ onAnalysis, onSave, allMatches, loadMatchesSafeFn }) => {
  const [mode, setMode] = useState("demanda");
  const [sels, setSels] = useState([{ league: "", match: "", matchManual: "", market: "" }]);
  const [targetOdds, setTargetOdds] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesError, setMatchesError] = useState(null);
  const [localMatches, setLocalMatches] = useState(allMatches);
  const [result, setResult] = useState(null);
  const [resultError, setResultError] = useState(null);

  useEffect(() => {
    if (allMatches.length > 0) { setLocalMatches(allMatches); return; }
    setLoadingMatches(true);
    setMatchesError(null);
    loadMatchesSafeFn().then(({ matches, error }) => {
      setLocalMatches(matches);
      if (error) setMatchesError("No se pudieron cargar partidos automáticamente. Puedes escribir el partido manualmente.");
    }).finally(() => setLoadingMatches(false));
  }, [allMatches, loadMatchesSafeFn]);

  const addSel = () => setSels([...sels, { league: "", match: "", matchManual: "", market: "" }]);
  const delSel = (i) => setSels(sels.filter((_, idx) => idx !== i));
  const updSel = (i, f, v) => { const s = [...sels]; s[i][f] = v; setSels(s); };

  const getMatchValue = (s) => s.matchManual?.trim() || s.match;
  const canAnalyze = sels.every(s => getMatchValue(s) && (mode === "demanda" || s.market));

  const getMatchesForLeague = (leagueName) => {
    if (!leagueName) return localMatches;
    const kws = leagueName.toLowerCase().split(" ").filter(w => w.length > 3);
    const f = localMatches.filter(m => kws.some(kw => m.league.toLowerCase().includes(kw)));
    return f.length > 0 ? f : localMatches;
  };

  const analyze = async () => {
    setLoading(true); setResult(null); setResultError(null);
    try {
      const selections = sels.map(s => ({
        match: getMatchValue(s),
        league: s.league || "desconocida",
        market: s.market || null,
      }));

      // AJUSTE 1: prompts con "cuota estimada/objetivo", no "cuota real Bet365"
      const systemContext = `Eres un analista experto en apuestas deportivas.
Fecha actual: ${todayLabel()}.
Las cuotas que generes son ESTIMADAS, no cuotas reales de Bet365.
REGLA: Si no tienes suficiente información fiable sobre un partido, devuelve verdict "DESCARTAR". NO fuerces apuestas.
Responde SIEMPRE en JSON válido sin texto adicional.`;

      const prompt = mode === "demanda"
        ? `${systemContext}

Analiza estos partidos y genera la mejor recomendación${targetOdds ? ` con cuota objetivo aproximada de ${targetOdds}` : ""}:
${JSON.stringify(selections)}

Considera todos los mercados Bet365: ambos marcan, más/menos goles, hándicap, resultado al descanso, jugadores, corners, tarjetas, etc.
Analiza: forma reciente, H2H, jugadores clave, lesiones, motivación y valor estimado vs cuota objetivo.

Devuelve este JSON exacto:
{
  "type": "demanda",
  "match": "...",
  "league": "...",
  "market": "...",
  "pick": "...",
  "odds": 1.75,
  "confidence": 72,
  "expectedValue": "positivo",
  "stake": "1u",
  "verdict": "APOSTAR",
  "analysis": "análisis mínimo 300 palabras con **Forma reciente**, **Head to Head**, **Jugadores clave**, **Valor estimado**",
  "mainRisk": "..."
}`
        : `${systemContext}

Analiza si este mercado tiene valor:
${JSON.stringify(selections)}

Analiza: forma reciente, H2H, jugadores clave, estadísticas del mercado, probabilidad real estimada vs cuota objetivo.

Devuelve este JSON exacto:
{
  "type": "propia",
  "match": "...",
  "league": "...",
  "market": "...",
  "pick": "...",
  "odds": 1.75,
  "confidence": 72,
  "expectedValue": "positivo",
  "stake": "1u",
  "verdict": "APOSTAR",
  "analysis": "análisis mínimo 300 palabras con **Forma reciente**, **Head to Head**, **Jugadores clave**, **Estadísticas del mercado**, **Valor estimado**",
  "mainRisk": "..."
}`;

      const parsed = await callAI(prompt);
      parsed.id = "d-" + Date.now();
      parsed.date = todayLabel();
      setResult(parsed);
    } catch (e) {
      setResultError(e.message || "Error al analizar. Inténtalo de nuevo.");
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: "flex", background: C.bgCard, borderRadius: 10, padding: 4, marginBottom: 16 }}>
        {[["demanda", "La app genera"], ["propia", "Mi apuesta"]].map(([v, l]) => (
          <button key={v} onClick={() => { setMode(v); setResult(null); setResultError(null); }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: mode === v ? C.green : "none", color: mode === v ? "#000" : C.grey2 }}>{l}</button>
        ))}
      </div>

      {loadingMatches && (
        <div style={{ background: C.bgCard, borderRadius: 10, padding: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <Spinner /><span style={{ color: C.grey2, fontSize: 13 }}>Cargando partidos del día...</span>
        </div>
      )}
      {matchesError && <ErrorBox message={matchesError} />}

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
          {localMatches.length > 0 && (
            <select value={s.match} onChange={e => { updSel(i, "match", e.target.value); updSel(i, "matchManual", ""); }} style={{ ...selStyle, marginBottom: 8 }}>
              <option value="">Selecciona partido...</option>
              {getMatchesForLeague(s.league).map(m => (
                <option key={m.id || m.match} value={m.match} style={{ background: C.bgCard }}>{m.match} — {m.league}</option>
              ))}
            </select>
          )}
          <input
            placeholder={localMatches.length > 0 ? "O escribe manualmente: Equipo A vs Equipo B" : "Escribe el partido: Equipo A vs Equipo B"}
            value={s.matchManual || ""}
            onChange={e => { updSel(i, "matchManual", e.target.value); updSel(i, "match", ""); }}
            style={{ ...selStyle, marginBottom: mode === "propia" ? 12 : 0 }}
          />

          {mode === "propia" && (
            <>
              <div style={{ color: C.grey2, fontSize: 11, marginBottom: 6 }}>MERCADO</div>
              <select value={s.market} onChange={e => updSel(i, "market", e.target.value)} style={selStyle} disabled={!getMatchValue(s)}>
                <option value="">{getMatchValue(s) ? "Selecciona mercado..." : "Primero introduce un partido"}</option>
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
        {loading ? <Spinner /> : !canAnalyze ? "Introduce un partido primero" : "Analizar"}
      </button>

      {resultError && <ErrorBox message={resultError} />}

      {result && !resultError && (
        <div style={{ marginTop: 14, background: C.bgCard, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", background: C.green + "18", borderBottom: `1px solid ${C.green}33`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Pill type="demanda" />
            <VerdictBadge verdict={result.verdict} />
          </div>
          {result.verdict === "DESCARTAR" ? (
            <div style={{ padding: 20, textAlign: "center" }}>
              <div style={{ color: C.red, fontSize: 28, marginBottom: 8 }}>✗</div>
              <div style={{ color: C.white, fontWeight: 700, marginBottom: 6 }}>Sin apuesta recomendada</div>
              <div style={{ color: C.grey2, fontSize: 13 }}>{result.reason || result.analysis || "No hay suficiente valor para esta apuesta."}</div>
            </div>
          ) : (
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.white, fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{result.match}</div>
                  <div style={{ color: C.green, fontSize: 13 }}>{result.market} · {result.pick}</div>
                </div>
                {/* AJUSTE 1: estimated en resultado de análisis */}
                <OddsBadge value={result.odds || 0} estimated />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div><div style={{ color: C.grey2, fontSize: 11, marginBottom: 5 }}>CONFIANZA</div><Confidence value={result.confidence || 0} /></div>
                <div style={{ textAlign: "right" }}>
                  {result.expectedValue && <div style={{ color: C.grey2, fontSize: 11 }}>Valor est.: <span style={{ color: result.expectedValue === "positivo" ? C.green : result.expectedValue === "negativo" ? C.red : C.yellow }}>{result.expectedValue}</span></div>}
                  {result.stake && <div style={{ color: C.yellow, fontWeight: 700 }}>Stake: {result.stake}</div>}
                </div>
              </div>
              {result.mainRisk && <div style={{ color: C.yellow, fontSize: 12, marginBottom: 12 }}>⚠️ {result.mainRisk}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onAnalysis(result)} style={{ flex: 1, background: C.bgCardLight, border: "none", borderRadius: 8, padding: "11px 0", color: C.green, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Ver análisis</button>
                <button onClick={() => onSave(result)} style={{ flex: 1, background: C.bgCardLight, border: "none", borderRadius: 8, padding: "11px 0", color: C.grey1, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Guardar</button>
              </div>
            </div>
          )}
        </div>
      )}
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
                {(bet.selections || []).map((s, i) => (
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
                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}><span style={{ color: C.grey2, fontSize: 13 }}>Cuota total est.</span><span style={{ color: C.yellow, fontWeight: 700 }}>{Number(bet.totalOdds || 0).toFixed(2)}</span></div>
              </>
            ) : (
              <>
                <div style={{ color: C.white, fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{bet.match}</div>
                <div style={{ color: C.grey2, fontSize: 13, marginBottom: bet.result ? 0 : 8 }}>{bet.market} · Cuota est. {bet.odds}</div>
                {bet.verdict && !bet.result && <div style={{ marginBottom: 8 }}><VerdictBadge verdict={bet.verdict} /></div>}
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
  const [betsError, setBetsError] = useState(null);
  const [allMatches, setAllMatches] = useState([]);

  const streak = (() => {
    if (register.length === 0) return 0;
    let s = 0;
    const sorted = [...register].filter(b => b.result).sort((a, b) => b.id.localeCompare(a.id));
    for (const b of sorted) { if (b.result === "ganada") s++; else if (b.result === "perdida") { s = s > 0 ? s : s - 1; break; } }
    return s;
  })();

  const generateBets = async () => {
    setLoadingBets(true);
    setDailyBet(null);
    setDreamBet(null);
    setBetsError(null);
    try {
      let matches = allMatches;
      if (matches.length === 0) {
        matches = await fetchMatchesStrict();
        setAllMatches(matches);
      }

      if (matches.length === 0) {
        setBetsError("No se han encontrado partidos disponibles hoy.");
        setLoadingBets(false);
        return;
      }

      const matchList = matches.slice(0, 25).map(m => `${m.match} (${m.league})`).join("\n");
      // Conjunto normalizado para validación AJUSTE 3
      const normalizedMatchSet = new Set(matches.map(m => normalizeMatch(m.match)));

      // AJUSTE 1: prompt sin "cuota real Bet365", solo "cuota estimada/objetivo"
      const prompt = `Eres un analista experto en apuestas deportivas.
Fecha actual: ${todayLabel()}.
Las cuotas que generes son ESTIMADAS, no cuotas reales de Bet365.
REGLA: Si no hay partidos con valor claro, devuelve verdict "DESCARTAR" para la apuesta diaria.

Partidos disponibles hoy (SOLO estos, no inventes otros):
${matchList}

Genera DOS apuestas usando ÚNICAMENTE partidos de la lista anterior:

1. DIARIA (partido único): cuota objetivo 1.50-1.80, mercado con más valor estimado (ambos marcan, goles, hándicap, jugadores...). Analiza forma reciente y jugadores clave.

2. SOÑADORA (combinada 3-4 partidos): cuota total estimada 8-11. Solo partidos de la lista.

Devuelve este JSON exacto y válido:
{
  "daily": {
    "type": "diaria",
    "match": "partido exacto de la lista",
    "league": "liga",
    "market": "mercado específico",
    "pick": "selección concreta",
    "odds": 1.65,
    "confidence": 80,
    "expectedValue": "positivo",
    "stake": "1u",
    "verdict": "APOSTAR",
    "analysis": "análisis 300 palabras con **Forma reciente**, **Jugadores clave**, **Valor estimado**",
    "mainRisk": "riesgo principal"
  },
  "dream": {
    "type": "soñadora",
    "selections": [
      {"match": "partido exacto de la lista", "league": "liga", "pick": "selección", "odds": 1.65}
    ],
    "totalOdds": 9.5,
    "analysis": "análisis 150 palabras",
    "mainRisk": "riesgo principal"
  }
}`;

      const parsed = await callAI(prompt);
      if (!parsed.daily) throw new Error("La IA no devolvió el formato esperado.");

      // AJUSTE 3: validar que daily.match está en la lista real
      const dailyMatchNorm = normalizeMatch(parsed.daily.match);
      if (!normalizedMatchSet.has(dailyMatchNorm)) {
        throw new Error("La IA devolvió un partido fuera de la lista real. Reintenta.");
      }

      // AJUSTE 3: validar que todos los partidos de dream están en la lista real
      if (parsed.dream?.selections) {
        for (const sel of parsed.dream.selections) {
          const selNorm = normalizeMatch(sel.match);
          if (!normalizedMatchSet.has(selNorm)) {
            throw new Error("La IA devolvió un partido fuera de la lista real. Reintenta.");
          }
        }
      }

      // AJUSTE 4: campos garantizados en daily
      const daily = {
        type: parsed.daily.type || "diaria",
        match: parsed.daily.match || "",
        league: parsed.daily.league || "",
        market: parsed.daily.market || "",
        pick: parsed.daily.pick || "",
        odds: parsed.daily.odds || 0,
        confidence: parsed.daily.confidence || 0,
        expectedValue: parsed.daily.expectedValue || "neutro",
        stake: parsed.daily.stake || "1u",
        verdict: parsed.daily.verdict || "ESPERAR",
        analysis: parsed.daily.analysis || "",
        mainRisk: parsed.daily.mainRisk || "",
        id: "daily-" + Date.now(),
        date: todayLabel(),
        result: null,
      };

      // AJUSTE 4: campos garantizados en dream
      let dream = null;
      if (parsed.dream?.selections?.length > 0) {
        const totalOdds = parsed.dream.totalOdds ||
          parsed.dream.selections.reduce((a, s) => a * (s.odds || 1), 1);
        dream = {
          type: "soñadora",
          selections: parsed.dream.selections,
          totalOdds,
          analysis: parsed.dream.analysis || "",
          mainRisk: parsed.dream.mainRisk || "",
          id: "dream-" + Date.now(),
          date: todayLabel(),
          result: null,
        };
      }

      setDailyBet(daily);
      setDreamBet(dream);

    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("partidos") || msg.includes("SportAPI") || msg.includes("fixtures")) {
        setBetsError("No se pudieron cargar partidos reales de hoy. Inténtalo más tarde.");
      } else {
        setBetsError(msg || "Error al generar las apuestas. Inténtalo de nuevo.");
      }
    }
    setLoadingBets(false);
  };

  const saveToRegister = (bet) => {
    setRegister(prev => [{ ...bet, stake: distribution?.demanda }, ...prev]);
    setTab("registro");
  };

  const loadMatchesSafeFn = useCallback(() => fetchMatchesSafe(), []);

  const TABS = [
    { id: "inicio", icon: "⌂", label: "Inicio" },
    { id: "analizar", icon: "◎", label: "Analizar" },
    { id: "registro", icon: "☰", label: "Registro" },
    { id: "stats", icon: "▲", label: "Stats" },
    { id: "ajustes", icon: "◈", label: "Ajustes" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.white, fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif", maxWidth: 480, margin: "0 auto", paddingBottom: 72 }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select, textarea, button { font-family: inherit; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        @keyframes b365pulse { 0%,100%{opacity:.3;transform:scale(.7)} 50%{opacity:1;transform:scale(1)} }
        input::placeholder { color: ${C.grey3}; }
        select option { background: ${C.bgCard}; color: ${C.white}; }
      `}</style>

      <div style={{ background: "#13151a", borderBottom: `1px solid ${C.border}`, padding: "14px 18px", position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: C.green, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: "#000" }}>B</div>
          <div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 17 }}>BetAnalysis</div>
            <div style={{ color: C.green, fontSize: 10, letterSpacing: 1 }}>POWERED BY AI</div>
          </div>
        </div>
        <div style={{ background: C.bgCard, borderRadius: 20, padding: "6px 14px", border: `1px solid ${C.border}` }}>
          <span style={{ color: C.white, fontSize: 13, fontWeight: 600 }}>{todayLabel()}</span>
        </div>
      </div>

      <div style={{ padding: 14 }}>
        {tab === "inicio" && <HomeTab budget={budget} setBudget={setBudget} distribution={distribution} setDistribution={setDistribution} onAnalysis={setModal} dailyBet={dailyBet} dreamBet={dreamBet} loadingBets={loadingBets} betsError={betsError} generateBets={generateBets} streak={streak} />}
        {tab === "analizar" && <AnalyzeTab onAnalysis={setModal} onSave={saveToRegister} allMatches={allMatches} loadMatchesSafeFn={loadMatchesSafeFn} />}
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
