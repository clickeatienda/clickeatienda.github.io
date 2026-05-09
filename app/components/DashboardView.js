"use client";
import { useState, useEffect } from "react";
import {
  ShoppingCart, Package, Truck, DollarSign, TrendingUp, TrendingDown,
  Share2, MessageSquare, RefreshCw, Eye, Users, Zap,
  Plus, Video, Image, BarChart3, Clock
} from "lucide-react";
import { SalesChart, ContentChart } from "./Charts";



export default function DashboardView() {
  const [data, setData] = useState({
    stats: {
      ventasHoy: 0, productsActive: 0, visitasHoy: 0,
      tasaDevolucion: 0, contentPublished: 0, margenPromedio: 8,
    },
    recentProducts: [],
    socialQueue: [],
    timeline: [],
    loading: true
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        setData({ ...json, loading: false });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setData(prev => ({ ...prev, loading: false }));
      }
    }
    fetchData();
  }, []);

  const statsList = [
    { label: "Ventas Hoy", value: data.stats.ventasHoy, sub: "Últimas 24h", icon: "💰", color: "blue", change: null },
    { label: "Productos Activos", value: data.stats.productsActive, sub: "En catálogo", icon: "📦", color: "purple", change: null },
    { label: "Visitas Hoy", value: data.stats.visitasHoy, sub: "Únicas", icon: "👁️", color: "green", change: null },
    { label: "Tasa Devolución", value: `${data.stats.tasaDevolucion}%`, sub: "Objetivo: <20%", icon: "🔄", color: "yellow", change: null },
    { label: "Contenido Publicado", value: data.stats.contentPublished, sub: "Total", icon: "📱", color: "blue", change: null },
    { label: "Margen Promedio", value: `${data.stats.margenPromedio}%`, sub: "Objetivo: 25%", icon: "📊", color: "green", change: null },
  ];

  if (data.loading) {
    return <div className="animate-in"><div className="empty-state">Cargando datos del sistema...</div></div>;
  }

  return (
    <div className="animate-in">
      {/* Stats Grid */}
      <div className="stats-grid">
        {statsList.map((s, i) => (
          <div className={`stat-card stagger-${i + 1}`} key={s.label} style={{ "--stat-accent": s.color === "green" ? "var(--success)" : s.color === "yellow" ? "var(--warning)" : s.color === "purple" ? "var(--info)" : "var(--brand-primary)" }}>
            <div className="stat-card-header">
              <div className={`stat-card-icon ${s.color}`}>{s.icon}</div>
              {s.change && (
                <span className={`stat-card-change ${s.change > 0 ? "positive" : "negative"}`}>
                  {s.change > 0 ? "+" : ""}{s.change}%
                </span>
              )}
            </div>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="panel-grid">
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title">
              <TrendingUp size={16} /> Ventas y Visitas — Última Semana
            </div>
            <span className="panel-card-action">Ver más →</span>
          </div>
          <div className="panel-card-body">
            <SalesChart />
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title">
              <Share2 size={16} /> Contenido Publicado por Plataforma
            </div>
            <span className="panel-card-action">Ver más →</span>
          </div>
          <div className="panel-card-body">
            <ContentChart />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="panel-grid">
        {/* Quick Actions */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title">
              <Zap size={16} /> Acciones Rápidas
            </div>
          </div>
          <div className="panel-card-body">
            <div className="actions-grid">
              <div className="action-btn">
                <Plus size={24} />
                Importar Productos
              </div>
              <div className="action-btn">
                <Video size={24} />
                Crear Video
              </div>
              <div className="action-btn">
                <Image size={24} />
                Crear Post
              </div>
              <div className="action-btn">
                <DollarSign size={24} />
                Ajustar Precios
              </div>
              <div className="action-btn">
                <BarChart3 size={24} />
                Ver Analytics
              </div>
              <div className="action-btn">
                <RefreshCw size={24} />
                Sincronizar Dropi
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title">
              <Clock size={16} /> Actividad Reciente
            </div>
            <span className="panel-card-action">Ver todo →</span>
          </div>
          <div className="panel-card-body">
            {data.timeline.length > 0 ? data.timeline.map((t, i) => (
              <div className="timeline-item" key={i}>
                <div className="timeline-dot" style={{ background: t.color || 'var(--brand-primary-light)', fontSize: 16 }}>
                  {t.icon}
                </div>
                <div className="timeline-content">
                  <div className="timeline-text">{t.text}</div>
                  <div className="timeline-time">{t.time}</div>
                </div>
              </div>
            )) : <div className="empty-state-text" style={{padding: 20, textAlign: 'center'}}>No hay actividad reciente</div>}
          </div>
        </div>
      </div>

      {/* Products & Social Queue */}
      <div className="panel-grid">
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title">
              <Package size={16} /> Últimos Productos
            </div>
            <span className="panel-card-action">Ver catálogo →</span>
          </div>
          <div className="panel-card-body no-padding">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.recentProducts.length > 0 ? data.recentProducts.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <div className="product-row">
                        <div className="product-thumb" style={{ background: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                          {p.images && p.images[0] ? <img src={p.images[0]} alt={p.name} /> : "📦"}
                        </div>
                        <div className="product-info">
                          <div className="product-name">{p.name}</div>
                          <div className="product-category">{p.category}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {p.selling_price ? `$${p.selling_price.toLocaleString()}` : '--'}
                    </td>
                    <td><span className="badge neutral">{p.is_active ? 'activo' : 'inactivo'}</span></td>
                  </tr>
                )) : <tr><td colSpan="3" style={{textAlign: 'center', padding: 20}}>No hay productos aún</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title">
              <Share2 size={16} /> Cola de Publicación
            </div>
            <span className="panel-card-action">Ver todo →</span>
          </div>
          <div className="panel-card-body no-padding">
            {data.socialQueue.length > 0 ? data.socialQueue.map((s, i) => (
              <div className="social-item" key={i}>
                <div className={`social-platform-icon ${s.platform}`}>
                  {s.platform === "tiktok" ? "TK" : s.platform === "instagram" ? "IG" : s.platform === "youtube" ? "YT" : "FB"}
                </div>
                <div className="social-item-info">
                  <div className="social-item-title">{s.title}</div>
                  <div className="social-item-meta">{s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : 'Programado'}</div>
                </div>
                <div className="social-item-status">
                  <span className="badge neutral">{s.status}</span>
                </div>
              </div>
            )) : <div className="empty-state-text" style={{padding: 20, textAlign: 'center'}}>No hay contenido en cola</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
