import React, { useState, useEffect, useRef } from 'react';
import { useCaffeineStore } from './store';
import type { Source } from './store';

const EMOJI_OPTIONS = ['☕', '🧋', '🥤', '🍵', '🧃', '🥛', '🍫', '🧉', '🧊'];

function App() {
  const sources = useCaffeineStore((s) => s.sources);
  const logs = useCaffeineStore((s) => s.logs);
  const limit = useCaffeineStore((s) => s.settings.dailyLimit);
  const addLog = useCaffeineStore((s) => s.addLog);
  const addSource = useCaffeineStore((s) => s.addSource);
  const resetToday = useCaffeineStore((s) => s.resetToday);
  const hydrate = useCaffeineStore((s) => s.hydrate);
  const setDailyLimit = useCaffeineStore((s) => s.setDailyLimit);

  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [displayMg, setDisplayMg] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newEmoji, setNewEmoji] = useState('☕');
  const [newName, setNewName] = useState('');
  const [newMg, setNewMg] = useState('');
  const [formError, setFormError] = useState('');
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState(limit.toString());

  // Remove demo sources flag for a clean state
  useEffect(() => {
    localStorage.removeItem('demoSourcesAdded');
  }, []);

  // Hydrate store on mount
  useEffect(() => {
    hydrate();
    setTimeout(() => setHydrated(true), 0);
    // eslint-disable-next-line
  }, []);

  useEffect(() => { setLimitInput(limit.toString()); }, [limit]);

  // Calculate today's total mg
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const todayLogs = logs.filter(l => l.timestamp >= startOfDay);
  const todayMg = todayLogs.reduce((sum, l) => sum + l.mg, 0);

  // Subtle count-up animation for intake
  useEffect(() => {
    let frame: number;
    if (displayMg !== todayMg) {
      const step = () => {
        setDisplayMg(prev => {
          if (prev === todayMg) return prev;
          const diff = todayMg - prev;
          const inc = Math.ceil(Math.abs(diff) / 8) * Math.sign(diff);
          return Math.abs(diff) < 2 ? todayMg : prev + inc;
        });
        frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(frame);
  }, [todayMg]);

  // Warning if over limit
  const overLimit = todayMg > limit;

  // Add Drink form logic
  const handleAddDrink = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newName.trim() || newName.length < 2) {
      setFormError('Name must be at least 2 characters.');
      return;
    }
    const mg = parseInt(newMg, 10);
    if (isNaN(mg) || mg < 1 || mg > 1000) {
      setFormError('Caffeine must be 1-1000 mg.');
      return;
    }
    addSource({ name: newName.trim(), caffeinePerServing: mg, emoji: newEmoji });
    setNewName('');
    setNewMg('');
    setNewEmoji('☕');
    setShowAdd(false);
    setToast('Drink added!');
  };

  return (
    <div className="container">
      <h1>Caffeine Tracker</h1>
      <div style={{ color: '#888', marginBottom: 24, fontWeight: 500 }}>Monitor your daily caffeine intake</div>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {sources.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 16, alignItems: 'center' }}>
              <span>Daily Intake</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {editingLimit ? (
                  <>
                    <input
                      type="number"
                      value={limitInput}
                      onChange={e => setLimitInput(e.target.value)}
                      min={50}
                      max={2000}
                      style={{ width: 60, fontSize: 15, borderRadius: 6, border: '1px solid #bbb', padding: '2px 6px', marginRight: 4 }}
                    />
                    <button
                      style={{ background: '#6f4e37', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 8px', fontWeight: 600, marginRight: 2, cursor: 'pointer' }}
                      onClick={() => {
                        const val = parseInt(limitInput, 10);
                        if (!isNaN(val) && val >= 50 && val <= 2000) {
                          setDailyLimit(val);
                          setEditingLimit(false);
                          setToast('Daily limit updated!');
                        }
                      }}
                      aria-label="Save limit"
                    >Save</button>
                    <button
                      style={{ background: '#bbb', color: '#222', border: 'none', borderRadius: 6, padding: '2px 8px', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => { setEditingLimit(false); setLimitInput(limit.toString()); }}
                      aria-label="Cancel"
                    >Cancel</button>
                  </>
                ) : (
                  <>
                    <span>{displayMg}mg / {limit}mg</span>
                    <button
                      style={{ background: 'none', border: 'none', color: '#6f4e37', fontSize: 18, marginLeft: 4, cursor: 'pointer', padding: 0 }}
                      onClick={() => setEditingLimit(true)}
                      aria-label="Edit daily limit"
                    >✏️</button>
                  </>
                )}
              </span>
            </div>
            {/* Progress Bar */}
            <div style={{ margin: '18px 0 38px 0' }}>
              <div className="progress-bar-bg" style={{ height: 28 }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min((todayMg / limit) * 100, 100)}%`,
                    backgroundColor:
                      (todayMg / limit) > 0.9 ? '#c62828' :
                      (todayMg / limit) > 0.7 ? '#ffc107' :
                      '#6f4e37',
                    height: '100%'
                  }}
                />
                {/* Removed mg/limit label text here */}
              </div>
            </div>
            {overLimit && (
              <div style={{ color: '#c62828', fontWeight: 600, marginTop: 8, textAlign: 'center', fontSize: 15 }}>
                ⚠️ Over your daily limit!
              </div>
            )}
          </>
        )}
        {/* Add Drink Button & Form */}
        <div style={{ margin: '38px 0 12px 0', textAlign: 'center' }}>
          {!showAdd && (
            <button className="reset-btn" style={{ background: '#6f4e37', marginBottom: 0 }} onClick={() => setShowAdd(true)}>
              + Add Drink
            </button>
          )}
          {showAdd && (
            <form onSubmit={handleAddDrink} style={{ background: '#fffdf9', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 18, marginTop: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>Emoji:</span>
                <select value={newEmoji} onChange={e => setNewEmoji(e.target.value)} style={{ fontSize: 24, padding: 2, borderRadius: 6 }}>
                  {EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <input
                type="text"
                placeholder="Drink name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={{ fontSize: 16, padding: 6, borderRadius: 6, border: '1px solid #ccc', marginBottom: 10, width: '100%' }}
                maxLength={40}
                required
              />
              <input
                type="number"
                placeholder="Caffeine (mg)"
                value={newMg}
                onChange={e => setNewMg(e.target.value)}
                style={{ fontSize: 16, padding: 6, borderRadius: 6, border: '1px solid #ccc', marginBottom: 10, width: '100%' }}
                min={1}
                max={1000}
                required
              />
              {formError && <div style={{ color: '#c62828', fontWeight: 500, marginBottom: 8 }}>{formError}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="submit" className="reset-btn" style={{ background: '#6f4e37' }}>Add</button>
                <button type="button" className="reset-btn" style={{ background: '#bbb', color: '#222' }} onClick={() => { setShowAdd(false); setFormError(''); }}>Cancel</button>
              </div>
            </form>
          )}
        </div>
        {/* User's Drink Cards */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          {sources.map((source) => (
            <div key={source.id} className={`coffee-card${selected === source.id ? ' coffee-card-selected' : ''}`} style={{ borderColor: selected === source.id ? '#c0a16b' : '#ddd', background: selected === source.id ? '#fff7e0' : '#fffdf9', position: 'relative' }}>
              <button
                onClick={() => {
                  setSelected(source.id);
                  try {
                    addLog({ timestamp: Date.now(), sourceId: source.id, servings: 1 });
                  } catch (e) {
                    setToast('Error logging serving.');
                  }
                }}
                aria-pressed={selected === source.id}
                style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 }}
              >
                <span style={{ fontSize: 28, marginRight: 6 }}>{(source as any).emoji || '☕'}</span>
                <span style={{ fontWeight: 600, fontSize: 17 }}>{source.name}</span>
                <span style={{ fontSize: 14, color: '#888', marginLeft: 8 }}>{source.caffeinePerServing}mg</span>
              </button>
              <button
                onClick={() => {
                  useCaffeineStore.getState().removeSource(source.id);
                  setToast('Drink deleted!');
                  if (selected === source.id) setSelected(null);
                }}
                aria-label={`Delete ${source.name}`}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  background: '#f5e6d6',
                  border: 'none',
                  borderRadius: '50%',
                  fontSize: 14,
                  width: 26,
                  height: 26,
                  color: '#c62828',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: 15, lineHeight: 1 }}>🗑️</span>
              </button>
            </div>
          ))}
        </div>
        <button className="reset-btn" onClick={() => { resetToday(); setSelected(null); }}>
          Reset Tracker
        </button>
        {toast && (
          <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#c62828', color: 'white', padding: '12px 28px', borderRadius: 10, fontWeight: 600, fontSize: 16, boxShadow: '0 4px 16px rgba(198,40,40,0.12)', zIndex: 50 }} role="alert">
            {toast}
            <button style={{ marginLeft: 16, background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }} onClick={() => setToast(null)} aria-label="Close">×</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
