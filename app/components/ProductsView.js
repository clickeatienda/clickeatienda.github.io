"use client";
import { useState, useEffect } from "react";
import { Package, Search, Filter, Edit, Trash2, ExternalLink } from "lucide-react";
import ImportProductModal from "./ImportProductModal";

export default function ProductsView() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        // Fallback to recent products for now if a specific /api/products route doesn't exist
        setProducts(json.recentProducts || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setLoading(false);
      }
    }
    fetchProducts();
  }, [isImportModalOpen]); // Refresh when modal closes (might have new product)

  if (loading) {
    return <div className="animate-in"><div className="empty-state">Cargando catálogo de productos...</div></div>;
  }

  return (
    <div className="animate-in">
      <ImportProductModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />

      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="panel-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="panel-card-title">
            <Package size={16} /> Catálogo Completo
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
             <button className="btn" style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}><Filter size={14}/> Filtrar</button>
             <button 
               className="btn" 
               style={{ padding: '6px 12px', background: 'var(--brand-primary)', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer' }}
               onClick={() => setIsImportModalOpen(true)}
             >
               + Nuevo Producto
             </button>
          </div>
        </div>
        <div className="panel-card-body no-padding">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Costo Proveedor</th>
                <th>Precio Sugerido</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? products.map((p, i) => (
                <tr key={i}>
                  <td>
                    <div className="product-row">
                      <div className="product-thumb" style={{ background: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        {p.images && p.images[0] ? <img src={p.images[0]} alt={p.name} /> : "📦"}
                      </div>
                      <div className="product-info">
                        <div className="product-name">{p.name}</div>
                        <div className="product-category" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ID: {p.dropi_id}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge" style={{background: 'var(--bg-tertiary)'}}>{p.category || 'General'}</span></td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>
                    {p.supplier_cost ? `$${p.supplier_cost.toLocaleString()}` : '--'}
                  </td>
                  <td style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: 'var(--success)' }}>
                    {p.selling_price ? `$${p.selling_price.toLocaleString()}` : 'Calculando...'}
                  </td>
                  <td>{p.stock}</td>
                  <td><span className="badge neutral">{p.is_active ? 'activo' : 'inactivo'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)' }}>
                       <Edit size={16} style={{cursor: 'pointer'}} />
                       <ExternalLink size={16} style={{cursor: 'pointer'}} />
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="7" style={{textAlign: 'center', padding: 40}}><div className="empty-state-title">No hay productos</div><div className="empty-state-text">Usa el Botón Mágico en Dropi para importar tu primer producto.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
