"use client";
import { useState } from "react";
import {
  LayoutDashboard, Package, TrendingUp, DollarSign, Share2,
  MessageSquare, Settings, ShoppingCart, Truck, BarChart3,
  RefreshCw, Users, Bell, ChevronRight
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", badge: null },
      { id: "ventas", icon: ShoppingCart, label: "Ventas", badge: null },
      { id: "productos", icon: Package, label: "Productos", badge: null },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { id: "envios", icon: Truck, label: "Envíos", badge: null },
      { id: "precios", icon: DollarSign, label: "Motor de Precios", badge: null },
      { id: "devoluciones", icon: RefreshCw, label: "Devoluciones", badge: null },
    ],
  },
  {
    label: "Marketing",
    items: [
      { id: "redes", icon: Share2, label: "Redes Sociales", badge: null },
      { id: "contenido", icon: TrendingUp, label: "Contenido", badge: null },
    ],
  },
  {
    label: "Soporte",
    items: [
      { id: "atencion", icon: MessageSquare, label: "Atención al Cliente", badge: null },
      { id: "analytics", icon: BarChart3, label: "Analytics", badge: null },
    ],
  },
];

export default function Sidebar({ activeSection, onNavigate, isOpen, onClose }) {
  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? "visible" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <img src="/icon.png" alt="Clickea Tienda" />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Clickea Tienda</span>
            <span className="sidebar-brand-label">Panel de Control</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div className="sidebar-section" key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`sidebar-link ${activeSection === item.id ? "active" : ""}`}
                    onClick={() => { onNavigate(item.id); onClose(); }}
                  >
                    <Icon />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`sidebar-link-badge ${item.badgeType || ""}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-status">
            <span className="sidebar-status-dot" />
            Sistema operando — Automatizado
          </div>
        </div>
      </aside>
    </>
  );
}
