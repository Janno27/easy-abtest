import React from 'react';

interface TableProps {
  headers: string[];
  rows: any[];
  alignments?: string[];
  id?: string;
  onRowClick?: (id: string) => void;
}

const Table: React.FC<TableProps> = ({ headers, rows, alignments = [], id, onRowClick }) => {
  const defaultAlignment = 'left';
  
  const getAlignment = (index: number) => {
    return alignments[index] || defaultAlignment;
  };

  const getTextAlignClass = (alignment: string) => {
    switch (alignment) {
      case 'left':
        return 'text-left';
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200" id={id}>
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th 
                key={index}
                scope="col" 
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${getTextAlignClass(getAlignment(index))}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className={onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
              onClick={onRowClick ? () => onRowClick(row.ID) : undefined}
            >
              {headers.map((header, colIndex) => (
                <td 
                  key={colIndex} 
                  className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${getTextAlignClass(getAlignment(colIndex))}`}
                >
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
export type { TableProps }; 