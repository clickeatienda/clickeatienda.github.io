"use client";
// Force Vercel Refresh - Reverting Storefront
import { useState, useEffect } from "react";
import { Bell, Menu, RefreshCw, Settings } from "lucide-react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import ProductsView from "./components/ProductsView";

export default function Home() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString("es-CO", {
          timeZone: "America/Bogota",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          day: "2-digit", month: "short",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const SECTION_TITLES = {
    dashboard: { title: "Dashboard", sub: "Vista general del sistema" },
    ventas: { title: "Ventas", sub: "Pedidos y transacciones" },
    productos: { title: "Productos", sub: "Catálogo y stock" },
    envios: { title: "Envíos", sub: "Tracking y logística" },
    precios: { title: "Motor de Precios", sub: "Márgenes y ajustes automáticos" },
    devoluciones: { title: "Devoluciones", sub: "Gestión de devoluciones y cancelaciones" },
    redes: { title: "Redes Sociales", sub: "Publicaciones y analytics" },
    contenido: { title: "Fábrica de Contenido", sub: "Creación automática de contenido" },
    atencion: { title: "Atención al Cliente", sub: "Mensajes y respuestas automáticas" },
    analytics: { title: "Analytics", sub: "Métricas avanzadas y reportes" },
  };

  const section = SECTION_TITLES[activeSection] || SECTION_TITLES.dashboard;

  const renderView = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardView />;
      case "productos":
        return <ProductsView />;
      default:
        return (
          <div className="animate-in">
            <div className="panel-card">
              <div className="panel-card-body">
                <div className="empty-state">
                  <Settings size={48} />
                  <div className="empty-state-title">Módulo en construcción</div>
                  <div className="empty-state-text">
                    El módulo de {section.title} se está construyendo. Volverá a estar disponible pronto.
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-content">
        <header className="main-header">
          <div className="main-header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <div>
              <div className="header-title">{section.title}</div>
              <div className="header-subtitle">{section.sub}</div>
            </div>
          </div>
          <div className="main-header-right">
            <span className="header-time">🇨🇴 COL {currentTime}</span>
            <button className="header-btn" title="Sincronizar"><RefreshCw size={16} /></button>
            <button className="header-btn" title="Notificaciones"><Bell size={16} /></button>
            <button className="header-btn" title="Configuración"><Settings size={16} /></button>
          </div>
        </header>

        <div className="main-body">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
