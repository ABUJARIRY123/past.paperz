import React from 'react';

const Spinner = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-green-300 backdrop-blur-sm z-50">
      <div className="relative">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      </div>
    </div>
  );
};

export default Spinner;