"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Clipboard, FileText, Home, LoaderCircle, Plus, Send, Sparkles, X } from "lucide-react";
import { PLATFORMS, recommendedPlatforms, type Platform } from "../lib/content";

type Variant = { id: string; platform: Platform; content: string; status: string };
type Moment = { id: string; rawText: string; project: string; status: string; scheduledAt: string | null; createdAt: string; variants: Variant[] };
type View = "today" | "stories" | "calendar";

const projects: Record<string, string> = { sod: "SØD", orbita: "Órbita", kadmontech: "Kadmontech", personal: "Personal" };
const platformUrls: Record<Platform, string> = {
  LinkedIn: "https://www.linkedin.com/feed/?shareActive=true",
  X: "https://x.com/compose/post",
  Instagram: "https://www.instagram.com/",
  Threads: "https://www.threads.net/",
  TikTok: "https://www.tiktok.com/upload",
  YouTube: "https://studio.youtube.com/",
};

const short = (value: string, length = 110) => value.length > length ? `${value.slice(0, length).trim()}…` : value;
const dateLabel = (value: string) => new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(value));

export default function ContentOS() {
  const [view, setView] = useState<View>("today");
  const [moments, setMoments] = useState<Moment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [project, setProject] = useState("sod");
  const [platforms, setPlatforms] = useState<Platform[]>(["LinkedIn", "X", "Threads"]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");

  const selected = moments.find((item) => item.id === selectedId) || null;
  const scheduled = useMemo(() => moments.filter((item) => item.scheduledAt).sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime()), [moments]);
  const pending = moments.filter((item) => item.status === "review");

  async function load() {
    try {
      const response = await fetch("/api/moments", { cache: "no-store" });
      const data = await response.json() as { error?: string; moments?: Moment[] };
      if (!response.ok) throw new Error(data.error || "No pudimos abrir tu espacio.");
      setMoments(data.moments || []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos abrir tu espacio."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function togglePlatform(platform: Platform) {
    setPlatforms((current) => current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]);
  }

  async function capture() {
    setError(""); setBusy(true);
    try {
      const response = await fetch("/api/moments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rawText, project, platforms }) });
      const data = await response.json() as { error?: string; moment?: Moment };
      if (!response.ok) throw new Error(data.error || "No pudimos guardar el momento.");
      if (!data.moment) throw new Error("La respuesta no incluyó la historia creada.");
      setMoments((current) => [data.moment!, ...current]); setSelectedId(data.moment.id); setRawText(""); setPlatforms(["LinkedIn", "X", "Threads"]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos guardar el momento."); }
    finally { setBusy(false); }
  }

  function updateVariant(id: string, content: string) {
    setMoments((current) => current.map((moment) => ({ ...moment, variants: moment.variants.map((variant) => variant.id === id ? { ...variant, content, status: "draft" } : variant) })));
  }

  async function saveVariant(variant: Variant, status = variant.status) {
    const response = await fetch(`/api/variants/${variant.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: variant.content, status }) });
    const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error || "No pudimos guardar el borrador.");
  }

  async function markReady() {
    if (!selected) return; setBusy(true); setError("");
    try {
      await Promise.all(selected.variants.map((variant) => saveVariant(variant, "ready")));
      const response = await fetch(`/api/moments/${selected.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "ready" }) });
      if (!response.ok) throw new Error("No pudimos marcar la historia como lista.");
      setMoments((current) => current.map((item) => item.id === selected.id ? { ...item, status: "ready", variants: item.variants.map((variant) => ({ ...variant, status: "ready" })) } : item));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos guardar los cambios."); }
    finally { setBusy(false); }
  }

  async function schedule() {
    if (!selected || !scheduleAt) { setError("Elegí fecha y hora."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/moments/${selected.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "scheduled", scheduledAt: scheduleAt }) });
      const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error || "No pudimos programar la historia.");
      setMoments((current) => current.map((item) => item.id === selected.id ? { ...item, status: "scheduled", scheduledAt: new Date(scheduleAt).toISOString() } : item));
      setScheduleAt("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos programar la historia."); }
    finally { setBusy(false); }
  }

  async function copy(variant: Variant) {
    await navigator.clipboard.writeText(variant.content); setCopied(variant.id); setTimeout(() => setCopied(null), 1800);
  }

  return (
    <div className="cos-shell">
      <aside className="cos-sidebar">
        <div className="cos-brand"><span>CØ</span><div>CONTENT OS<small>Construir. Capturar. Contar.</small></div></div>
        <nav aria-label="Navegación principal">
          <button className={view === "today" ? "active" : ""} onClick={() => setView("today")}><Home size={18}/>Hoy</button>
          <button className={view === "stories" ? "active" : ""} onClick={() => setView("stories")}><FileText size={18}/>Historias</button>
          <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}><CalendarDays size={18}/>Calendario</button>
        </nav>
        <div className="cos-sidebar-note"><strong>SØD primero</strong><span>Es el proyecto predeterminado. Los demás se mantienen separados.</span></div>
      </aside>

      <main className="cos-main">
        <header className="cos-topbar"><div><span className="cos-mobile-brand">CØ</span><strong>{view === "today" ? "Hoy" : view === "stories" ? "Historias" : "Calendario"}</strong></div><button className="cos-primary compact" onClick={() => { setView("today"); document.getElementById("capture")?.focus(); }}><Plus size={17}/>Capturar</button></header>

        {view === "today" && <div className="cos-page">
          <section className="cos-hero"><p>CAPTURAR ANTES DE QUE SE PIERDA</p><h1>¿Qué pasó hoy?</h1><span>Contalo como te salga. CONTENT OS prepara los primeros borradores.</span></section>
          <div className="cos-today-grid">
            <section className="cos-capture-card">
              <textarea id="capture" value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder="Salí de una reunión, tomamos una decisión, algo falló, apareció una idea…" maxLength={12000}/>
              <div className="cos-capture-options">
                <label>Proyecto<select value={project} onChange={(event) => setProject(event.target.value)}><option value="sod">SØD</option><option value="orbita">Órbita</option><option value="kadmontech">Kadmontech</option><option value="personal">Personal</option></select></label>
                <button className="cos-quiet" onClick={() => setPlatforms(recommendedPlatforms(rawText))} disabled={!rawText.trim()}><Sparkles size={15}/>Sugerir redes</button>
              </div>
              <div className="cos-platforms" aria-label="Redes de destino">{PLATFORMS.map((platform) => <button key={platform} className={platforms.includes(platform) ? "selected" : ""} onClick={() => togglePlatform(platform)} aria-pressed={platforms.includes(platform)}>{platform}</button>)}</div>
              {error && <p className="cos-error" role="alert">{error}</p>}
              <div className="cos-capture-footer"><span>{platforms.length} {platforms.length === 1 ? "borrador" : "borradores"}</span><button className="cos-primary" onClick={capture} disabled={busy || !rawText.trim()}>{busy ? <LoaderCircle className="spin" size={18}/> : <Sparkles size={18}/>}Generar publicaciones</button></div>
            </section>
            <aside className="cos-next"><div className="cos-section-head"><div><p>SIGUIENTE ACCIÓN</p><h2>Para revisar</h2></div><span>{pending.length}</span></div>{loading ? <div className="cos-loading"><LoaderCircle className="spin"/>Abriendo tu espacio…</div> : pending.length ? pending.slice(0, 4).map((moment) => <button className="cos-moment-row" key={moment.id} onClick={() => setSelectedId(moment.id)}><span>{projects[moment.project]}</span><strong>{short(moment.rawText)}</strong><small>{moment.variants.length} versiones · {dateLabel(moment.createdAt)}</small></button>) : <div className="cos-empty"><Check size={24}/><strong>Todo al día</strong><span>Las nuevas capturas aparecerán acá para revisión.</span></div>}</aside>
          </div>
          <section className="cos-recent"><div className="cos-section-head"><div><p>ARCHIVO RECIENTE</p><h2>Últimas historias</h2></div><button className="cos-link" onClick={() => setView("stories")}>Ver todas</button></div><div className="cos-story-grid">{moments.slice(0, 3).map((moment) => <button className="cos-story-card" key={moment.id} onClick={() => setSelectedId(moment.id)}><div><span>{projects[moment.project]}</span><i data-status={moment.status}>{moment.status === "review" ? "Revisar" : moment.status === "ready" ? "Lista" : moment.status === "scheduled" ? "Programada" : moment.status}</i></div><strong>{short(moment.rawText, 150)}</strong><small>{moment.variants.map((variant) => variant.platform).join(" · ")}</small></button>)}</div></section>
        </div>}

        {view === "stories" && <div className="cos-page"><section className="cos-page-title"><p>TU NARRATIVA EN CONSTRUCCIÓN</p><h1>Historias</h1><span>Una captura, sus versiones y una sola decisión: publicar o programar.</span></section><div className="cos-story-list">{moments.map((moment) => <button className="cos-story-line" key={moment.id} onClick={() => setSelectedId(moment.id)}><div><span>{projects[moment.project]}</span><i data-status={moment.status}>{moment.status === "review" ? "Revisar" : moment.status === "ready" ? "Lista" : moment.status === "scheduled" ? "Programada" : moment.status}</i></div><strong>{short(moment.rawText, 190)}</strong><small>{moment.variants.length} publicaciones · {dateLabel(moment.createdAt)}</small></button>)}</div>{!loading && !moments.length && <div className="cos-empty large"><FileText/><strong>Todavía no hay historias</strong><span>Capturá el primer momento. El resto del flujo empieza solo.</span></div>}</div>}

        {view === "calendar" && <div className="cos-page"><section className="cos-page-title"><p>CONTINUIDAD SIN COMPLICACIONES</p><h1>Calendario</h1><span>Solo lo que ya decidiste publicar.</span></section><div className="cos-calendar-list">{scheduled.map((moment) => <button key={moment.id} onClick={() => setSelectedId(moment.id)}><time>{dateLabel(moment.scheduledAt!)}</time><div><span>{projects[moment.project]}</span><strong>{short(moment.rawText, 180)}</strong><small>{moment.variants.map((variant) => variant.platform).join(" · ")}</small></div></button>)}</div>{!loading && !scheduled.length && <div className="cos-empty large"><CalendarDays/><strong>El calendario está libre</strong><span>Cuando una historia esté lista, asignale fecha desde su editor.</span></div>}</div>}
      </main>
      <nav className="cos-mobile-nav" aria-label="Navegación móvil">
        <button className={view === "today" ? "active" : ""} onClick={() => setView("today")}><Home size={18}/><span>Hoy</span></button>
        <button className={view === "stories" ? "active" : ""} onClick={() => setView("stories")}><FileText size={18}/><span>Historias</span></button>
        <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}><CalendarDays size={18}/><span>Calendario</span></button>
      </nav>

      {selected && <div className="cos-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}><section className="cos-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title"><header><div><span>{projects[selected.project]} · {dateLabel(selected.createdAt)}</span><h2 id="editor-title">Revisar publicaciones</h2></div><button aria-label="Cerrar" onClick={() => setSelectedId(null)}><X/></button></header><div className="cos-source"><small>MOMENTO ORIGINAL</small><p>{selected.rawText}</p></div><div className="cos-variants">{selected.variants.map((variant) => <article key={variant.id}><div><strong>{variant.platform}</strong><span>Borrador inicial · editable</span></div><textarea value={variant.content} onChange={(event) => updateVariant(variant.id, event.target.value)} onBlur={() => saveVariant(variant).catch((cause) => setError(cause.message))}/><footer><span>{variant.content.length} caracteres</span><div><button className="cos-quiet" onClick={() => copy(variant)}>{copied === variant.id ? <Check size={16}/> : <Clipboard size={16}/>}{copied === variant.id ? "Copiado" : "Copiar"}</button><a className="cos-quiet" href={platformUrls[variant.platform]} target="_blank" rel="noreferrer"><Send size={15}/>Abrir {variant.platform}</a></div></footer></article>)}</div>{error && <p className="cos-error editor-error" role="alert">{error}</p>}<div className="cos-editor-actions"><div className="cos-schedule"><label>Fecha de publicación<input type="datetime-local" value={scheduleAt} onChange={(event) => setScheduleAt(event.target.value)}/></label><button className="cos-quiet" onClick={schedule} disabled={busy || !scheduleAt}><CalendarDays size={16}/>Programar</button></div><button className="cos-primary" onClick={markReady} disabled={busy}>{busy ? <LoaderCircle className="spin" size={18}/> : <Check size={18}/>}Guardar y dejar lista</button></div></section></div>}
    </div>
  );
}
