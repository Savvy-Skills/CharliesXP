import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { SectionShell } from '../SectionShell';

const rawData = [
  { name: 'Borough Market', category: 'Market', zone: 'Southwark', status: 'Published' },
  { name: 'Tate Modern', category: 'Museum', zone: 'Southwark', status: 'Published' },
  { name: 'The Anchor', category: 'Pub', zone: 'Southwark', status: 'Published' },
  { name: 'Maltby Street', category: 'Street Food', zone: 'Bermondsey', status: 'Draft' },
  { name: 'Flat Iron Square', category: 'Bar', zone: 'Southwark', status: 'Published' },
];

type Column = 'name' | 'category' | 'zone' | 'status';

const statusStyle: Record<string, React.CSSProperties> = {
  Published: { background: 'rgba(34,197,94,0.10)', color: 'rgb(22,163,74)' },
  Draft:     { background: 'rgba(234,179,8,0.10)', color: 'rgb(161,98,7)' },
};

export function SGDataTable() {
  const [sortCol, setSortCol] = useState<Column>('name');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (col: Column) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  };

  const sorted = [...rawData].sort((a, b) => {
    const av = a[sortCol], bv = b[sortCol];
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortAsc ? cmp : -cmp;
  });

  const columns: { key: Column; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'zone', label: 'Zone' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <SectionShell id="data-table" title="Data Table">
      <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--sg-border)' }}>
        <table className="w-full text-sm" style={{ fontFamily: 'var(--sg-font)' }}>
          <thead>
            <tr style={{ background: 'var(--sg-navy)' }}>
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  className="px-5 py-3 text-left font-semibold cursor-pointer select-none"
                  style={{ color: 'rgba(247,244,240,0.9)' }}
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center gap-1.5">
                    {label}
                    {sortCol === key ? (
                      sortAsc
                        ? <ChevronUp size={13} style={{ color: 'var(--sg-offwhite)' }} />
                        : <ChevronDown size={13} style={{ color: 'var(--sg-offwhite)' }} />
                    ) : (
                      <ChevronDown size={13} style={{ opacity: 0.3, color: 'var(--sg-offwhite)' }} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={row.name}
                style={{ background: i % 2 === 0 ? '#fff' : 'var(--sg-offwhite)' }}
              >
                <td className="px-5 py-3 font-semibold" style={{ color: 'var(--sg-navy)' }}>{row.name}</td>
                <td className="px-5 py-3" style={{ color: 'var(--sg-navy)', opacity: 0.7 }}>{row.category}</td>
                <td className="px-5 py-3" style={{ color: 'var(--sg-navy)', opacity: 0.7 }}>{row.zone}</td>
                <td className="px-5 py-3">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={statusStyle[row.status]}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}
