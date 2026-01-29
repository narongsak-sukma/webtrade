import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TableColumn<T = any> {
  key: string;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface TableProps<T = any> extends HTMLAttributes<HTMLDivElement> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (record: T, index: number) => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

export function Table<T = any>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
  emptyIcon,
  className,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        {emptyIcon && <div className="mx-auto mb-4 text-neutral-400">{emptyIcon}</div>}
        <p className="text-neutral-500 dark:text-neutral-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto scrollbar-light', className)}>
      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
        <thead className="bg-neutral-50 dark:bg-neutral-900">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider',
                  column.className
                )}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-neutral-950 divide-y divide-neutral-200 dark:divide-neutral-800">
          {data.map((record, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                'hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(record, rowIndex)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-6 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300',
                    column.className
                  )}
                >
                  {column.render
                    ? column.render(record[column.key], record, rowIndex)
                    : record[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
