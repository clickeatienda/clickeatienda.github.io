"use client";
import { useState } from "react";
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle, ExternalLink, Search, ImageIcon, Video, Rocket } from "lucide-react";

export default function ImportProductModal({ isOpen, onClose }) {
  const [step, setStep] = useState('input');
  const [productName, setProductName] = useState("");
  const [productImageUrls, setProductImageUrls] = useState("");
  const [reviewImageUrls, setReviewImageUrls] = useState("");
  const [featuresImageUrl, setFeaturesImageUrl] = useState("");
  const [gifUrls, setGifUrls] = useState("");
  const [supplierCost, setSupplierCost] = useState("");
  const [dropiId, setDropiId] = useState("");
  const [category, setCategory] = useState("Tecnología");
  
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [resultProduct, setResultProduct] = useState(null);

  if (!isOpen) return null;

  async function handleStartImport(e) {
    e.preventDefault();
    if (!productName || !supplierCost || !productImageUrls) {
      setError("Faltan campos: Nombre, Costo y al menos una Imagen principal son obligatorios.");
      return;
    }

    setStep('processing');
    setProgress(10);
    setStatusMessage("Enviando a la cola de investigación...");
    setError("");

    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          dropiId,
          productImageUrls: productImageUrls.split('\n').map(u => u.trim()).filter(Boolean),
          reviewImageUrls: reviewImageUrls.split('\n').map(u => u.trim()).filter(Boolean),
          featuresImageUrl: featuresImageUrl.trim(),
          gifUrls: gifUrls.split('\n').map(u => u.trim()).filter(Boolean),
          supplierCost: parseFloat(supplierCost),
          category
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error en el servidor");

      // Polling
      const interval = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/products/import?id=${json.id}`);
          const pollData = await pollRes.json();

          if (pollData.status === 'ready') {
            clearInterval(interval);
            setResultProduct(pollData.product);
            setStep('success');
          } else if (pollData.status === 'failed') {
            clearInterval(interval);
            setError(pollData.status_message || "Falló la investigación");
            setStep('error');
          } else {
            setProgress(pollData.progress || 20);
            setStatusMessage(pollData.status_message || "Investigando...");
          }
        } catch (err) {
          console.error("Poll error:", err);
        }
      }, 3000);

    } catch (err) {
      setError(err.message);
      setStep('error');
    }
  }

  const reset = () => {
    setStep('input');
    setProductName("");
    setProductImageUrls("");
    setReviewImageUrls("");
    setFeaturesImageUrl("");
    setGifUrls("");
    setSupplierCost("");
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={20} color="#4A9EFF" />
            <span>Importación Inteligente v2.1</span>
          </div>
          <button className="modal-close" onClick={reset}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {step === 'input' && (
            <form onSubmit={handleStartImport}>
              <div className="form-group">
                <label>Nombre del Producto en Dropi</label>
                <input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="Ej: Humidificador Volcán" />
              </div>

              <div className="form-group" style={{ background: '#f0f7ff', padding: '10px', borderRadius: '8px', border: '1px solid #4A9EFF' }}>
                <label style={{ color: '#4A9EFF', display: 'flex', alignItems: 'center', gap: '5px' }}><ImageIcon size={16}/> URLs de Imágenes Principales (Una por línea)</label>
                <textarea 
                  value={productImageUrls} 
                  onChange={e => setProductImageUrls(e.target.value)} 
                  placeholder="Pegue aquí los enlaces de las fotos (Ej: https://...)" 
                  rows="3"
                  required 
                  className="modal-textarea"
                />
              </div>

              <div className="form-group" style={{ background: '#fdf4ff', padding: '10px', borderRadius: '8px', border: '1px solid #d946ef', marginTop: '10px' }}>
                <label style={{ color: '#d946ef', display: 'flex', alignItems: 'center', gap: '5px' }}><Search size={16}/> URLs de Fotos de Reseñas (Opcional)</label>
                <textarea 
                  value={reviewImageUrls} 
                  onChange={e => setReviewImageUrls(e.target.value)} 
                  placeholder="Pegue aquí fotos de clientes usando el producto..." 
                  rows="2"
                  className="modal-textarea"
                  style={{ borderColor: 'rgba(217, 70, 239, 0.3)' }}
                />
              </div>

              <div className="form-group" style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #22c55e', marginTop: '10px' }}>
                <label style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '5px' }}><ImageIcon size={16}/> Imagen de Características Técnicas (Opcional)</label>
                <input 
                  type="url"
                  value={featuresImageUrl} 
                  onChange={e => setFeaturesImageUrl(e.target.value)} 
                  placeholder="Si ya tienes una foto con textos técnicos, pégala aquí..." 
                  className="modal-input-special"
                />
              </div>

              <div className="form-group" style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px solid #f59e0b', marginTop: '10px' }}>
                <label style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px' }}><Video size={16}/> URLs de GIFs Personalizados (Opcional)</label>
                <textarea 
                  value={gifUrls} 
                  onChange={e => setGifUrls(e.target.value)} 
                  placeholder="El 1ro reemplaza el carrusel automático en Detalles del Producto. El 2do va debajo de las reseñas." 
                  rows="2"
                  className="modal-textarea"
                  style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Costo Proveedor (COP)</label>
                  <input type="number" value={supplierCost} onChange={e => setSupplierCost(e.target.value)} placeholder="45000" />
                </div>
                <div className="form-group">
                  <label>ID Dropi (Opcional)</label>
                  <input type="text" value={dropiId} onChange={e => setDropiId(e.target.value)} placeholder="12345" />
                </div>
              </div>

              {error && <div className="error-box">{error}</div>}

              <button type="submit" className="btn-magic">Comenzar Investigación</button>
            </form>
          )}

          {step === 'processing' && (
            <div className="processing">
              <div className="bar-bg"><div className="bar-fill" style={{ width: `${progress}%` }}></div></div>
              <p className="status-text">{statusMessage}</p>
              <div className="loader"><Loader2 className="spin" /></div>
            </div>
          )}

          {step === 'success' && (
            <div className="success">
              <CheckCircle2 size={48} color="#22C55E" />
              <h3>¡Importado con éxito!</h3>
              <p>El producto ya está en tu catálogo de Shopify.</p>
              <a href={resultProduct?.shopify_url} target="_blank" className="btn-magic">Ver en Shopify</a>
              <button onClick={reset} style={{ background: 'none', border: 'none', marginTop: '10px', color: '#666', cursor: 'pointer' }}>Cerrar</button>
            </div>
          )}

          {step === 'error' && (
            <div className="error">
              <AlertCircle size={48} color="#EF4444" />
              <h3>Error de Importación</h3>
              <p>{error}</p>
              <button onClick={() => setStep('input')} className="btn-magic">Volver a intentar</button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .modal-content { background: #0F172A; border: 1px solid #1E293B; border-radius: 16px; width: 100%; max-width: 450px; color: white; overflow: hidden; }
        .modal-header { padding: 20px; border-bottom: 1px solid #1E293B; display: flex; justify-content: space-between; align-items: center; }
        .modal-title { display: flex; align-items: center; gap: 10px; font-weight: 700; }
        .modal-close { background: none; border: none; color: #64748B; cursor: pointer; }
        .modal-body { padding: 20px; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; font-size: 12px; color: #94A3B8; margin-bottom: 5px; }
        .form-group input, .form-group textarea { 
          width: 100%; 
          background: #1E293B; 
          border: 1px solid #334155; 
          border-radius: 8px; 
          padding: 10px; 
          color: white !important; 
          font-size: 14px;
          outline: none; 
          font-family: inherit;
        }
        .form-group textarea {
          resize: vertical;
          min-height: 60px;
        }
        .modal-textarea {
          background: rgba(15, 23, 42, 0.3) !important;
          border-color: rgba(74, 158, 255, 0.3) !important;
        }
        .modal-input-special {
          background: rgba(15, 23, 42, 0.3) !important;
          border-color: rgba(34, 197, 94, 0.3) !important;
        }
        .form-group input:focus, .form-group textarea:focus {
          border-color: #4A9EFF;
          background: #1E293B;
        }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .btn-magic { width: 100%; background: #4A9EFF; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 10px; display: block; text-align: center; text-decoration: none; }
        .error-box { background: rgba(239, 68, 68, 0.1); color: #EF4444; padding: 10px; border-radius: 6px; font-size: 12px; margin-bottom: 10px; }
        .processing { text-align: center; padding: 20px; }
        .bar-bg { background: #1E293B; height: 10px; border-radius: 5px; overflow: hidden; margin-bottom: 10px; }
        .bar-fill { background: #4A9EFF; height: 100%; transition: width 0.3s; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .success, .error { text-align: center; padding: 20px; }
      `}</style>
    </div>
  );
}
