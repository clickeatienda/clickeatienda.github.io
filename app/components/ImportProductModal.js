"use client";
import { useState, useEffect } from "react";
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle, ShoppingBag, Search, ImageIcon, Video, FileText, Rocket } from "lucide-react";

export default function ImportProductModal({ isOpen, onClose }) {
  const [step, setStep] = useState('input'); // 'input', 'processing', 'success', 'error'
  const [productName, setProductName] = useState("");
  const [dropiId, setDropiId] = useState("");
  const [dropiImageUrl, setDropiImageUrl] = useState("");
  const [supplierCost, setSupplierCost] = useState("");
  const [category, setCategory] = useState("Tecnología");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [resultProduct, setResultProduct] = useState(null);

  const categories = [
    "Tecnología", "Belleza", "Hogar", "Moda", "Deportes",
    "Herramientas", "Mascotas", "Juguetes", "Vehículos", "Oficina",
  ];

  if (!isOpen) return null;

  async function handleStartImport(e) {
    e.preventDefault();
    if (!productName || !supplierCost || !dropiImageUrl) {
      setError("Por favor completa el nombre, el costo y el link de la imagen.");
      return;
    }

    setStep('processing');
    setProgress(5);
    setStatusMessage("Iniciando solicitud de importación...");
    setError("");

    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          dropiId,
          dropiImageUrl,
          supplierCost: parseFloat(supplierCost),
          category
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al iniciar importación");

      const productId = json.id;
      
      // Start polling for status updates
      pollStatus(productId);

    } catch (err) {
      setStep('error');
      setError(err.message);
    }
  }

  async function pollStatus(id) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/products/import?id=${id}`);
        const json = await res.json();

        if (json.status === 'ready') {
          clearInterval(interval);
          setProgress(100);
          setStatusMessage("¡Importación completada con éxito!");
          setResultProduct(json.product);
          setStep('success');
        } else if (json.status === 'failed') {
          clearInterval(interval);
          setStep('error');
          setError(json.error || "La investigación falló.");
        } else {
          // Update progress and message
          setProgress(json.progress || progress);
          setStatusMessage(json.status_message || statusMessage);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
  }

  const reset = () => {
    setStep('input');
    setProductName("");
    setDropiId("");
    setDropiImageUrl("");
    setSupplierCost("");
    setProgress(0);
    setStatusMessage("");
    setError("");
    setResultProduct(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-in" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={18} className="text-brand" />
            <span>Importación Inteligente</span>
          </div>
          <button className="modal-close" onClick={reset}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {step === 'input' && (
            <form onSubmit={handleStartImport} className="import-form">
              <div className="form-group">
                <label>Nombre del Producto (como está en Dropi)</label>
                <input 
                  type="text" 
                  placeholder="Ej: Smartwatch T900 Ultra" 
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Link de Imagen de Dropi (Derecho -> Copiar dirección de imagen)</label>
                <input 
                  type="url" 
                  placeholder="https://app.dropi.co/storage/products/..." 
                  value={dropiImageUrl}
                  onChange={(e) => setDropiImageUrl(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ID de Dropi (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 12345" 
                    value={dropiId}
                    onChange={(e) => setDropiId(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Costo Proveedor (COP)</label>
                  <input 
                    type="number" 
                    placeholder="Ej: 45000" 
                    value={supplierCost}
                    onChange={(e) => setSupplierCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {error && <div className="error-box"><AlertCircle size={14} /> {error}</div>}

              <div className="import-info">
                <Sparkles size={14} />
                <span>El sistema investigará en Amazon, AliExpress y más para crear una landing premium automáticamente.</span>
              </div>

              <button type="submit" className="btn btn-primary w-full">
                Comenzar Investigación Mágica
              </button>
            </form>
          )}

          {step === 'processing' && (
            <div className="processing-state">
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-status">{progress}%</div>
              
              <div className="status-steps">
                <div className={`status-step ${progress > 10 ? 'active' : ''}`}>
                  <Search size={16} /> Investigando plataformas internacionales...
                </div>
                <div className={`status-step ${progress > 40 ? 'active' : ''}`}>
                  <ImageIcon size={16} /> Descargando imágenes HD y reseñas...
                </div>
                <div className={`status-step ${progress > 70 ? 'active' : ''}`}>
                  <Video size={16} /> Generando GIFs de producto...
                </div>
                <div className={`status-step ${progress > 90 ? 'active' : ''}`}>
                  <Rocket size={16} /> Publicando landing en Shopify...
                </div>
              </div>
              
              <div className="current-status-msg">
                <Loader2 size={16} className="animate-spin" />
                {statusMessage}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="success-state">
              <div className="success-icon-wrapper">
                <CheckCircle2 size={48} className="text-success" />
              </div>
              <h3>¡Producto Listo!</h3>
              <p>Se ha creado la landing page y el producto en Shopify con éxito.</p>
              
              <div className="result-card">
                <div className="result-thumb">
                  {resultProduct?.images?.[0] ? <img src={resultProduct.images[0]} alt="" /> : <ShoppingBag size={24} />}
                </div>
                <div className="result-info">
                  <div className="result-name">{resultProduct?.name}</div>
                  <div className="result-price">${resultProduct?.selling_price?.toLocaleString()}</div>
                </div>
              </div>

              <div className="success-actions">
                <a href={resultProduct?.shopify_url} target="_blank" className="btn btn-primary w-full" rel="noreferrer">
                  <ExternalLink size={16} /> Ver en Shopify
                </a>
                <button onClick={reset} className="btn w-full mt-10">Cerrar</button>
              </div>
              
              <div className="reminder-box">
                <strong>Recordatorio:</strong> No olvides entrar a Dropify y vincular este producto al ID <code>{dropiId || 'de Dropi'}</code> para la logística.
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="error-state">
              <AlertCircle size={48} className="text-error" />
              <h3>Algo salió mal</h3>
              <p>{error}</p>
              <button onClick={() => setStep('input')} className="btn btn-primary w-full mt-20">Reintentar</button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          width: 100%;
          box-shadow: var(--shadow-xl);
          overflow: hidden;
        }
        .modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .modal-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          font-size: 16px;
        }
        .modal-close {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .modal-close:hover { background: var(--bg-tertiary); color: var(--text-primary); }
        .modal-body { padding: 20px; }
        
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
        .form-group input, .form-group select {
          width: 100%;
          background: var(--bg-main);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 10px 12px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }
        .form-group input:focus { border-color: var(--brand-primary); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        
        .import-info {
          display: flex;
          gap: 10px;
          background: rgba(74, 158, 255, 0.1);
          border: 1px solid rgba(74, 158, 255, 0.2);
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          color: var(--brand-primary-light);
          font-size: 12px;
          line-height: 1.4;
        }
        
        .progress-container {
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .progress-bar {
          height: 100%;
          background: var(--brand-primary);
          transition: width 0.5s ease;
        }
        .progress-status { text-align: right; font-size: 12px; font-weight: 700; color: var(--brand-primary); margin-bottom: 20px; }
        
        .status-steps { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
        .status-step {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: var(--text-tertiary);
          transition: all 0.3s ease;
        }
        .status-step.active { color: var(--text-primary); font-weight: 500; }
        .status-step.active svg { color: var(--brand-primary); }
        
        .current-status-msg {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px;
          background: var(--bg-tertiary);
          border-radius: 8px;
          font-size: 14px;
          color: var(--text-secondary);
        }
        
        .success-state { text-align: center; }
        .success-icon-wrapper { margin-bottom: 16px; }
        .success-state h3 { margin-bottom: 8px; font-size: 18px; }
        .success-state p { color: var(--text-secondary); font-size: 14px; margin-bottom: 24px; }
        
        .result-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--bg-main);
          border: 1px solid var(--border);
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 24px;
          text-align: left;
        }
        .result-thumb {
          width: 50px; height: 50px; border-radius: 4px; overflow: hidden;
          background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center;
        }
        .result-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .result-name { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
        .result-price { color: var(--success); font-weight: 700; font-size: 13px; }
        
        .reminder-box {
          margin-top: 20px;
          font-size: 11px;
          color: var(--text-tertiary);
          padding: 10px;
          background: var(--bg-tertiary);
          border-radius: 6px;
          line-height: 1.4;
        }
        
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .w-full { width: 100%; }
        .mt-10 { margin-top: 10px; }
        .mt-20 { margin-top: 20px; }
      `}</style>
    </div>
  );
}

function ExternalLink({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  );
}
