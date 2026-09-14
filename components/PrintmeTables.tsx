// components/PrintmeTables.tsx
// Renders the Printme reference tables as collapsible sections.
// The data lives in public/printme.json — adding a table is a data
// change, not a code change.
import React, { useEffect, useState } from 'react';

interface Grid {
  title?: string;
  columns: string[];
  rows: string[][];
  /** Index of a column whose repeated values merge into one tall cell. */
  mergeColumn?: number;
}

interface PrintmeTable extends Partial<Grid> {
  id: string;
  title: string;
  note?: string;
  /** Two or more grids shown beside each other instead of one table. */
  subtables?: Grid[];
}

/** How many rows from `start` share the same value in `col`. */
function spanAt(rows: string[][], start: number, col: number) {
  let n = 1;
  while (start + n < rows.length && rows[start + n][col] === rows[start][col]) n++;
  return n;
}

function Table({ columns, rows, mergeColumn, title }: Grid) {
  return (
    <div className="printme-grid">
      {title && <p className="printme-grid-title">{title}</p>}
      <div className="printme-scroll">
        <table className="printme-table">
          <thead>
            <tr>{columns.map((c, i) => <th key={i}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => {
                  if (mergeColumn === ci) {
                    // Skip cells absorbed by the tall cell above them
                    if (ri > 0 && rows[ri - 1][ci] === cell) return null;
                    const span = spanAt(rows, ri, ci);
                    return <td key={ci} rowSpan={span} className="printme-merged">{cell}</td>;
                  }
                  return <td key={ci}>{cell}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PrintmeTables() {
  const [tables, setTables] = useState<PrintmeTable[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/printme.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setTables)
      .catch(err => {
        console.warn('Could not load printme.json:', err);
        setError(true);
      });
  }, []);

  if (error) {
    return <p className="printme-empty">Reference tables are unavailable right now.</p>;
  }

  return (
    <div className="printme-list">
      {tables.map(table => {
        const isOpen = openId === table.id;
        return (
          <div key={table.id} className="printme-item">
            <button
              type="button"
              className="printme-toggle"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : table.id)}
            >
              <span className="printme-caret">{isOpen ? '▾' : '▸'}</span>
              {table.title}
            </button>

            {isOpen && (
              <div className="printme-panel">
                {table.note && <p className="printme-note">{table.note}</p>}

                {table.subtables ? (
                  <div className="printme-side-by-side">
                    {table.subtables.map((sub, i) => <Table key={i} {...sub} />)}
                  </div>
                ) : (
                  <Table
                    columns={table.columns ?? []}
                    rows={table.rows ?? []}
                    mergeColumn={table.mergeColumn}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
