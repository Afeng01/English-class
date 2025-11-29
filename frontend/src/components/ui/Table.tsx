import { ReactNode } from 'react';

interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  width?: string;
  className?: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

interface TableProps<T extends Record<string, any>> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: keyof T;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  emptyText?: string;
}

/**
 * 通用表格组件，支持选择行与自定义单元格渲染
 */
export default function Table<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  emptyText = '暂无数据',
}: TableProps<T>) {
  const isAllSelected = data.length > 0 && data.every(row => selectedRows.includes(String(row[rowKey])));
  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map(row => String(row[rowKey])));
    }
  };

  const toggleRow = (rowId: string) => {
    if (!onSelectionChange) return;
    if (selectedRows.includes(rowId)) {
      onSelectionChange(selectedRows.filter(id => id !== rowId));
    } else {
      onSelectionChange([...selectedRows, rowId]);
    }
  };

  if (!data.length) {
    return (
      <div className="w-full rounded-lg border border-dashed border-gray-200 bg-white py-12 text-center text-gray-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  checked={isAllSelected}
                  onChange={toggleAll}
                />
              </th>
            )}
            {columns.map(column => (
              <th
                key={String(column.key)}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 ${column.className || ''}`}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {data.map(row => {
            const rowId = String(row[rowKey]);
            return (
              <tr key={rowId} className="hover:bg-teal-50/40">
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      checked={selectedRows.includes(rowId)}
                      onChange={() => toggleRow(rowId)}
                    />
                  </td>
                )}
                {columns.map(column => {
                  const value = (row as Record<string, any>)[column.key as string];
                  return (
                    <td key={String(column.key)} className={`px-4 py-3 align-middle text-gray-700 ${column.className || ''}`}>
                      {column.render ? column.render(value, row) : value ?? '--'}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
