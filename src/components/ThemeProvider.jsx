// import React from 'react';
// import { useSelector } from 'react-redux';
// export default function ThemeProvider({ children }) {
//   const { theme } = useSelector((state) => state.theme);
//   return (
//     <div className={theme}>
//       <div className=' dark:text-white text-gray-700 dark:bg-zinc-950 wire-mesh bg-white min-h-screen'>
//         {children}
//       </div>
//     </div>
//   );
// }


import { useEffect } from 'react';
import { useSelector } from 'react-redux';

export default function ThemeProvider({ children }) {
  const { theme } = useSelector((state) => state.theme);

  useEffect(() => {
    const html = document.documentElement;

    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="wire-mesh bg-white dark:bg-zinc-950 min-h-screen text-gray-700 dark:text-white transition-colors duration-300">
      {children}
    </div>
  );
}

