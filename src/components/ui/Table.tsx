import React from 'react';

interface TableProps {
  headers: string[];
  rows: Record<string, string>[];
  alignments?: string[];
  id?: string;
  className?: string;
}

const Table: React.FC<TableProps> = ({
  headers,
  rows,
  alignments = [],
  id = "table",
  className = ""
}) => {
  // Utiliser les alignements fournis ou par défaut "left" pour tous les en-têtes
  const resolvedAlignments = headers.map((_, index) => 
    alignments[index] || 'left'
  );
  
  // Fonction pour obtenir la classe d'alignement
  const getAlignmentClass = (alignment: string) => {
    switch (alignment) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  return (
    <div className={`overflow-hidden rounded-lg border border-gray-200 shadow-sm mb-4 bg-white ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {headers.map((header, index) => (
              <th
                key={`${id}-th-${index}`}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider ${getAlignmentClass(resolvedAlignments[index])} ${index === headers.length - 1 ? '' : 'border-r border-gray-200'}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, rowIndex) => (
            <tr 
              key={`${id}-tr-${rowIndex}`}
              className={rowIndex % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
            >
              {headers.map((header, colIndex) => (
                <td
                  key={`${id}-td-${rowIndex}-${colIndex}`}
                  className={`px-4 py-3 text-sm text-gray-800 ${getAlignmentClass(resolvedAlignments[colIndex])} ${colIndex === headers.length - 1 ? '' : 'border-r border-gray-100'}`}
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