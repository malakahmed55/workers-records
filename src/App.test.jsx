import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { filterWorkers, loadWorkers, nextId, sortWorkers, STORAGE_KEY, validate } from './workers.js';

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('helpers', () => {
  it('validates fields', () => {
    expect(validate({ name: '', position: '', salary: '' })).toHaveProperty('name');
    expect(validate({ name: 'a', position: 'b', salary: '-1' })).toHaveProperty('salary');
    expect(validate({ name: 'a', position: 'b', salary: 'abc' })).toHaveProperty('salary');
    expect(validate({ name: 'a', position: 'b', salary: '0' })).toEqual({});
  });
  it('filters, sorts and numbers ids', () => {
    const l = [{ id: 1, name: 'Ann', position: 'Dev', salary: 3 }, { id: 5, name: 'Bob', position: 'QA', salary: 1 }];
    expect(filterWorkers(l, 'qa')).toHaveLength(1);
    expect(sortWorkers(l, 'salary', 'asc')[0].name).toBe('Bob');
    expect(sortWorkers(l, 'name', 'desc')[0].name).toBe('Bob');
    expect(nextId(l)).toBe(6);
    expect(nextId([])).toBe(1);
  });
  it('falls back to sample data on corrupt storage', () => {
    window.localStorage.setItem(STORAGE_KEY, '{oops');
    expect(loadWorkers()).toHaveLength(3);
  });
});

describe('App', () => {
  it('shows sample rows', () => {
    render(<App />);
    expect(screen.getByText('Sara Mostafa')).toBeInTheDocument();
    expect(screen.getByText('3 workers')).toBeInTheDocument();
  });

  it('adds a worker and persists it across remount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.type(screen.getByLabelText('Name'), 'Lina Adel');
    await user.type(screen.getByLabelText('Position'), 'Tester');
    await user.type(screen.getByLabelText('Salary'), '3900');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByText('Lina Adel')).toBeInTheDocument();
    unmount();
    render(<App />);
    expect(screen.getByText('Lina Adel')).toBeInTheDocument();
  });

  it('shows validation errors and does not add', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getAllByRole('alert')).toHaveLength(3);
    expect(screen.getByText('3 workers')).toBeInTheDocument();
  });

  it('edits a worker', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Edit Omar Hassan' }));
    const salary = screen.getByLabelText('Salary');
    await user.clear(salary);
    await user.type(salary, '9000');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const row = screen.getByText('Omar Hassan').closest('tr');
    expect(within(row).getByText('9,000')).toBeInTheDocument();
  });

  it('deletes a worker after confirm, and keeps it when cancelled', async () => {
    const user = userEvent.setup();
    render(<App />);
    window.confirm.mockReturnValueOnce(false);
    await user.click(screen.getByRole('button', { name: 'Delete Nour Ali' }));
    expect(screen.getByText('Nour Ali')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete Nour Ali' }));
    expect(screen.queryByText('Nour Ali')).not.toBeInTheDocument();
    expect(screen.getByText('2 workers')).toBeInTheDocument();
  });

  it('searches and shows the empty state', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Search workers'), 'designer');
    expect(screen.getByText('Omar Hassan')).toBeInTheDocument();
    expect(screen.queryByText('Sara Mostafa')).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText('Search workers'));
    await user.type(screen.getByLabelText('Search workers'), 'zzz');
    expect(screen.getByText('No workers match your search.')).toBeInTheDocument();
  });

  it('sorts by salary and views details', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /^Salary/ }));
    const first = screen.getAllByRole('row')[1];
    expect(within(first).getByText('Omar Hassan')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View Sara Mostafa' }));
    expect(screen.getByLabelText('Worker details')).toHaveTextContent('Programmer');
  });
});
