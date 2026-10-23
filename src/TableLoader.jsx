import React from "react";

const TableLoader = () => {
  const loadingRows = Array(5).fill(null);

  return (
    <div className="rounded-xl border border-green-200 overflow-hidden shadow-sm shadow-green-100/50 dark:border-green-900 dark:shadow-none">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-green-600 dark:bg-green-950">
            {['#', 'Name', 'Designation', 'Department', 'Gender', 'Contact', ''].map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <div className="h-2.5 bg-green-500/40 dark:bg-green-800 rounded animate-pulse" style={{ width: [10, 36, 70, 72, 48, 52, 0][i] }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loadingRows.map((_, idx) => (
            <tr key={idx} className="border-b border-green-100 even:bg-green-50 dark:border-green-900/50 dark:even:bg-green-950/20">
              {/* # */}
              <td className="px-4 py-3">
                <div className="w-6 h-6 bg-green-200 dark:bg-green-900 rounded-md animate-pulse" />
              </td>
              {/* Name */}
              <td className="px-4 py-3">
                <div className="h-3.5 bg-green-200 dark:bg-green-900 rounded animate-pulse w-32" />
              </td>
              {/* Designation pill */}
              <td className="px-4 py-3">
                <div className="h-5 bg-green-200 dark:bg-green-900 rounded-full animate-pulse w-24" />
              </td>
              {/* Department */}
              <td className="px-4 py-3">
                <div className="h-3.5 bg-green-200 dark:bg-green-900 rounded animate-pulse w-20" />
              </td>
              {/* Gender */}
              <td className="px-4 py-3">
                <div className="h-3.5 bg-green-200 dark:bg-green-900 rounded animate-pulse w-12" />
              </td>
              {/* Contact */}
              <td className="px-4 py-3">
                <div className="h-3.5 bg-green-200 dark:bg-green-900 rounded animate-pulse w-28" />
              </td>
              {/* Edit button */}
              <td className="px-4 py-3">
                <div className="h-7 w-16 bg-green-200 dark:bg-green-900 rounded-lg animate-pulse border border-green-300 dark:border-green-800" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableLoader;