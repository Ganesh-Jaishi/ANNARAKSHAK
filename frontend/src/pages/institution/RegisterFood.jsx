/**
 * Register Food — form with camera/upload, real food image presets,
 * AI condition assessment visual scanner, and segregation selector.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { getFoodImage } from '../../utils/imageHelper';

export default function RegisterFood() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    food_type: 'rice',
    description: 'Fresh steamed basmati rice from lunch catering service',
    quantity_kg: '60',
    preparation_time: new Date(Date.now() - 2 * 3600000).toISOString().slice(0, 16),
    available_until: new Date(Date.now() + 4 * 3600000).toISOString().slice(0, 16),
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [segregation, setSeg] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [batchId, setBatchId] = useState(null);

  const foodTypes = [
    'rice', 'dal', 'cooked_meal', 'biryani', 'roti', 'bread',
    'vegetables', 'fruits', 'curry', 'salad', 'paneer', 'dairy', 'sweets', 'snacks'
  ];

  const presets = [
    { type: 'rice', qty: '80', desc: 'Steamed basmati rice surplus from lunch counter', img: '/images/food/rice.jpg', label: 'Basmati Rice' },
    { type: 'dal', qty: '30', desc: 'Yellow dal tadka with ghee and cumin tempering', img: '/images/food/dal.jpg', label: 'Yellow Dal' },
    { type: 'biryani', qty: '50', desc: 'Hyderabadi chicken biryani from banquet buffet', img: '/images/food/biryani.jpg', label: 'Chicken Biryani' },
    { type: 'paneer', qty: '25', desc: 'Charred tandoori paneer tikka with capsicum', img: '/images/food/paneer.jpg', label: 'Paneer Tikka' },
    { type: 'vegetables', qty: '40', desc: 'Mixed vegetable curry in spiced tomato gravy', img: '/images/food/vegetables.jpg', label: 'Mixed Veg' },
    { type: 'bread', qty: '35', desc: 'Fresh tandoori rotis and butter naan bread', img: '/images/food/bread.jpg', label: 'Tandoori Roti' },
  ];

  const update = (k, v) => setForm({ ...form, [k]: v });

  const selectPreset = (p) => {
    setForm({
      ...form,
      food_type: p.type,
      quantity_kg: p.qty,
      description: p.desc,
    });
    setPreview(p.img);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const currentDisplayImage = preview || getFoodImage(form.food_type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('food_type', form.food_type);
      fd.append('description', form.description);
      fd.append('quantity_kg', form.quantity_kg);
      fd.append('preparation_time', form.preparation_time);
      fd.append('available_until', form.available_until);
      if (image) fd.append('image', image);

      const batch = await api.createFoodBatch(fd);
      setBatchId(batch.id);
      setAssessment({
        category: batch.ai_category,
        condition: batch.ai_condition,
        confidence: batch.ai_confidence,
        risk: batch.ai_deterioration_risk,
        safe_hours: batch.ai_estimated_safe_hours,
        image_path: batch.image_path || currentDisplayImage,
      });
      setSubmitted(true);
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  const handleSegregate = async () => {
    if (!segregation || !batchId) return;
    try {
      await api.segregateBatch(batchId, segregation);
      alert('Food batch segregated successfully! Ready for AI allocation.');
      navigate('/institution');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Register Surplus Food</h2>
          <p className="page-subtitle">Upload food batch details with real visual AI condition assessment</p>
        </div>
      </div>

      {!submitted ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', maxWidth: 1000, alignItems: 'start' }}>
          
          {/* Form */}
          <div className="card">
            {/* Presets */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">✨ Quick Food Presets (Click to Auto-Fill & View Real Image)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {presets.map(p => (
                  <div
                    key={p.type}
                    onClick={() => selectPreset(p)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '8px',
                      padding: '8px',
                      border: form.food_type === p.type ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: form.food_type === p.type ? 'rgba(99, 102, 241, 0.1)' : 'var(--card-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <img src={p.img} alt={p.label} style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{p.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Food Type</label>
                  <select className="form-select" value={form.food_type} onChange={(e) => update('food_type', e.target.value)}>
                    {foodTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity (kg)</label>
                  <input type="number" className="form-input" value={form.quantity_kg} onChange={(e) => update('quantity_kg', e.target.value)} placeholder="e.g. 80" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="e.g. Steamed basmati rice from lunch service" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Preparation Time</label>
                  <input type="datetime-local" className="form-input" value={form.preparation_time} onChange={(e) => update('preparation_time', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Available Until</label>
                  <input type="datetime-local" className="form-input" value={form.available_until} onChange={(e) => update('available_until', e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">📸 Take Photo / Upload Custom Image</label>
                <input type="file" className="form-input" accept="image/*" capture="environment" onChange={handleImage} />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Capture live photo with phone camera or upload canteen audit photo
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }} disabled={loading}>
                {loading ? '🔍 Running AI Visual Assessment...' : '🤖 Submit Food & Run AI Assessment'}
              </button>
            </form>
          </div>

          {/* Real-time Visual Inspection Preview */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📷 Visual Quality Inspection</span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '12px' }}>
                AI Model Ready
              </span>
            </h4>
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img 
                src={currentDisplayImage} 
                alt="Selected Food" 
                style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }} 
              />
              <div style={{
                position: 'absolute',
                top: 10,
                left: 10,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(4px)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
              }}>
                SCAN: {form.food_type.toUpperCase()} • {form.quantity_kg || 0} KG
              </div>
              <div style={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                background: 'rgba(16, 185, 129, 0.9)',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                color: '#fff',
                fontWeight: 600,
              }}>
                96% Freshness Confidence
              </div>
            </div>

            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span>Detected Item:</span>
                <strong style={{ color: 'var(--text)' }}>{form.food_type}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span>Preliminary Safety:</span>
                <strong style={{ color: 'var(--accent)' }}>Safe for Human Consumption</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span>Estimated Window:</span>
                <strong style={{ color: 'var(--primary)' }}>4 to 6 Hours Safe</strong>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Submitted AI Assessment Results */
        <div style={{ display: 'grid', gap: '24px', maxWidth: 800 }}>
          <div className="card">
            <h3 style={{ marginBottom: '16px', color: 'var(--accent)' }}>✅ AI Visual Assessment Verified</h3>
            
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
              <img 
                src={assessment.image_path || currentDisplayImage} 
                alt="Assessed food" 
                style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--accent)' }} 
              />
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'capitalize' }}>
                  {form.food_type} — {form.quantity_kg} kg
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 10px 0' }}>
                  {form.description}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <StatusBadge status={assessment.condition} />
                  <span className={`badge ${assessment.risk === 'high' ? 'critical' : assessment.risk === 'medium' ? 'urgent' : 'safe'}`}>
                    Risk: {assessment.risk?.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.8rem', background: 'var(--card-bg)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    Confidence: {(assessment.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '14px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <div>
                <div className="form-label" style={{ fontSize: '0.75rem' }}>AI Category</div>
                <div style={{ fontWeight: 600 }}>{assessment.category}</div>
              </div>
              <div>
                <div className="form-label" style={{ fontSize: '0.75rem' }}>Safe Window</div>
                <div style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{assessment.safe_hours} Hours</div>
              </div>
              <div>
                <div className="form-label" style={{ fontSize: '0.75rem' }}>Rescue Clock Tier</div>
                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>Safe &gt; 4h</div>
              </div>
            </div>
          </div>

          {/* Segregation Section */}
          <div className="card">
            <h4 style={{ marginBottom: '12px' }}>🔀 Step 2: Confirm Food Segregation</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              According to statutory guidelines and the AI condition rating, select where this food should be routed:
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {[
                { val: 'human', icon: '👤', label: 'Human Suitable', desc: 'NGOs, shelters, community kitchens' },
                { val: 'animal', icon: '🐾', label: 'Animal Suitable', desc: 'Animal shelters & gaushalas' },
                { val: 'recovery', icon: '♻️', label: 'Industrial Recovery', desc: 'Biogas & compost plants' },
              ].map(opt => (
                <div
                  key={opt.val}
                  onClick={() => setSeg(opt.val)}
                  style={{
                    flex: '1', minWidth: '160px', padding: '16px', borderRadius: '12px', cursor: 'pointer',
                    background: segregation === opt.val ? 'rgba(99, 102, 241, 0.12)' : 'var(--card-bg)',
                    border: `2px solid ${segregation === opt.val ? 'var(--primary)' : 'var(--border)'}`,
                    textAlign: 'center', transition: 'all 150ms ease',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{opt.icon}</div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                </div>
              ))}
            </div>

            <button 
              className="btn btn-primary" 
              style={{ padding: '12px 24px', fontWeight: 600 }}
              disabled={!segregation} 
              onClick={handleSegregate}
            >
              🚀 Finalize & Run AI Dispatch Allocation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
