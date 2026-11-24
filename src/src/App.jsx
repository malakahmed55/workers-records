import React, { useEffect, useMemo, useState } from 'react';
import {
  filterWorkers, loadWorkers, nextId, saveWorkers, sortWorkers, validate,
} from './workers.js';

const EMPTY = { name: '', position: '', salary: '' };

export default function App() {
  const [workers, setWorkers] = useState(() => loadWorkers());
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: 'id', dir: 'asc' });
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [viewing, setViewing] = useState(null);

  useEffect(() => { saveWorkers(workers); }, [workers]);

  const rows = useMemo(
    () => sortWorkers(filterWorkers(workers, query), sort.key, sort.dir),
    [workers, query, sort],
  );
  const total = useMemo(() => rows.reduce((s, w) => s + w.salary, 0), [rows]);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }

  function onSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const clean = { name: form.name.trim(), position: form.position.trim(), salary: Number(form.salary) };
    if (editingId === null) setWorkers((ws) => [...ws, { id: nextId(ws), ...clean }]);
    else setWorkers((ws) => ws.map((w) => (w.id === editingId ? { ...w, ...clean } : w)));
    setForm(EMPTY);
    setEditingId(null);
  }

  function startEdit(w) {
    setEditingId(w.id);
    setForm({ name: w.name, position: w.position, salary: String(w.salary) });
    setErrors({});
    setViewing(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setErrors({});
  }

  function remove(w) {
    if (!window.confirm(`Delete ${w.name}?`)) return;
    setWorkers((ws) => ws.filter((x) => x.id !== w.id));
    if (editingId === w.id) cancelEdit();
    if (viewing && viewing.id === w.id) setViewing(null);
  }

  function resetSample() {
    if (!window.confirm('Replace the list with the sample data?')) return;
    window.localStorage.removeItem('workers-records:v1');
    setWorkers(loadWorkers());
    cancelEdit();
    setViewing(null);
  }

  const arrow = (key) => (sort.key === key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '');
  const field = (name, label, props = {}) => (
    <label className="field">
      <span>{label}</span>
      <input
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        aria-invalid={errors[name] ? 'true' : 'false'}
        {...props}
      />
      {errors[name] && <small role="alert">{errors[name]}</small>}
    </label>
  );

  return (
    <main className="wrap">
      <header>
        <h1>Workers Records</h1>
        <p className="note">Sample data only. Changes are saved in this browser, there is no server.</p>
      </header>

      <form className="card form" onSubmit={onSubmit} noValidate aria-label={editingId === null ? 'Add worker' : 'Edit worker'}>
        <h2>{editingId === null ? 'Add worker' : 'Edit worker'}</h2>
        {field('name', 'Name')}
        {field('position', 'Position')}
        {field('salary', 'Salary', { inputMode: 'decimal' })}
        <div className="actions">
          <button type="submit" className="primary">{editingId === null ? 'Add' : 'Save'}</button>
          {editingId !== null && <button type="button" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      <section className="card">
        <div className="bar">
          <input
            type="search"
            placeholder="Search by name or position"
            aria-label="Search workers"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" onClick={resetSample}>Reset sample data</button>
        </div>

        {rows.length === 0 ? (
          <p className="empty">{workers.length === 0 ? 'No workers yet. Add the first one above.' : 'No workers match your search.'}</p>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th><button className="th" onClick={() => toggleSort('id')}>ID{arrow('id')}</button></th>
                  <th><button className="th" onClick={() => toggleSort('name')}>Name{arrow('name')}</button></th>
                  <th><button className="th" onClick={() => toggleSort('position')}>Position{arrow('position')}</button></th>
                  <th className="num"><button className="th" onClick={() => toggleSort('salary')}>Salary{arrow('salary')}</button></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w.id}>
                    <td data-label="ID">{w.id}</td>
                    <td data-label="Name">{w.name}</td>
                    <td data-label="Position">{w.position}</td>
                    <td className="num" data-label="Salary">{w.salary.toLocaleString('en-US')}</td>
                    <td className="row-actions">
                      <button onClick={() => setViewing(w)} aria-label={`View ${w.name}`}>View</button>
                      <button onClick={() => startEdit(w)} aria-label={`Edit ${w.name}`}>Edit</button>
                      <button className="danger" onClick={() => remove(w)} aria-label={`Delete ${w.name}`}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan="3">{rows.length} {rows.length === 1 ? 'worker' : 'workers'}</td><td className="num">{total.toLocaleString('en-US')}</td><td /></tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {viewing && (
        <section className="card detail" aria-label="Worker details">
          <h2>{viewing.name}</h2>
          <dl>
            <dt>ID</dt><dd>{viewing.id}</dd>
            <dt>Position</dt><dd>{viewing.position}</dd>
            <dt>Salary</dt><dd>{viewing.salary.toLocaleString('en-US')}</dd>
          </dl>
          <button onClick={() => setViewing(null)}>Close</button>
        </section>
      )}
    </main>
  );
}
