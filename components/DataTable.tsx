import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type Column<T> = {
  key: keyof T;
  header: ReactNode;
  render?: (value: T[keyof T], row: T) => ReactNode;
};

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  className?: string;
}

export function DataTable<T extends { id: string }>({ columns, data, className }: DataTableProps<T>) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-slate-200', className)}>
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white text-sm">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/80">
              {columns.map((column) => (
                <td key={String(column.key)} className="px-4 py-3 align-top">
                  {column.render ? column.render(row[column.key], row) : (row[column.key] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
