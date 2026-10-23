import React, { useState, useRef, useEffect } from 'react';
import { LogOut } from 'lucide-react';

export const Input = React.forwardRef(({ className = '', type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-black 
          file:border-0 file:bg-transparent file:text-sm file:font-medium 
          placeholder:text-gray-500 
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 
          disabled:cursor-not-allowed disabled:opacity-50 
          dark:border-gray-800 dark:bg-white dark:placeholder-gray-400 
          dark:focus-visible:ring-gray-800 ${className}`}
        ref={ref}
        {...props}
      />
    );
  });
  
  Input.displayName = 'Input';

export const Logout = () => {
<button className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
<LogOut className="w-5 h-5" />
Logout
</button>
}

export const Alert = ({ children, variant = 'default', className = '' }) => {
    const variants = {
      default: 'bg-gray-100 border-gray-200 text-gray-800',
      destructive: 'bg-red-50 border-red-200 text-red-700',
    };
  
    return (
      <div className={`p-4 rounded-lg border ${variants[variant]} ${className}`}>
        {children}
      </div>
    );
  };
  
  export const AlertDescription = ({ children, className = '' }) => (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
  
  // components/ui/card.jsx
  export const Card = ({ children, className = '' }) => (
    <div className={`bg-gray-700 rounded-lg border shadow-sm ${className}`}>
      {children}
    </div>
  );
  
  export const CardHeader = ({ children, className = 'bg-gray-800' }) => (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
  
  export const CardTitle = ({ children, className = '' }) => (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  );
  
  export const CardContent = ({ children, className = '' }) => (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );

  export const CardDescription = ({ children, className = '' }) => (
    <p className={`text-sm text-gray-400 mt-2 leading-normal ${className}`}>
      {children}
    </p>
  );
export const Badge = ({ children, variant = 'default' }) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800',
      secondary: 'bg-blue-100 text-blue-800',
      outline: 'border border-gray-300 text-gray-600',
    };
  
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${variants[variant]}`}>
        {children}
      </span>
    );
  };
  
  
  // Button.js
  export const Button = ({ children, variant = 'default', onClick, disabled, className = '' }) => {
    const variants = {
      default: 'bg-blue-500 text-white hover:bg-blue-600',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    };
  
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded-lg font-medium transition-colors
          ${variants[variant]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}`}
      >
        {children}
      </button>
    );
  };
  
  // Tab.js
  export const Tab = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium rounded-lg transition-colors
        ${active 
          ? 'bg-blue-500 text-white' 
          : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
      {children}
    </button>
  );

  export const Dialog = ({ open, onOpenChange, children }) => {
    if (!open) return null;
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div 
          className="fixed inset-0 bg-black/50" 
          onClick={() => onOpenChange(false)}
        />
        <div className="relative z-50">
          {children}
        </div>
      </div>
    );
  };
  
//   export const DialogContent = ({ children, className = '' }) => (
//     <div className={`bg-white rounded-lg shadow-lg w-full max-h-[90vh] overflow-y-auto
//       max-w-lg relative ${className}`}>
//       {children}
//     </div>
//   );
export const DialogContent = ({ children, className = '' }) => (
    <div className={`bg-white rounded-lg shadow-lg w-full max-h-[90vh] overflow-y-auto
      max-w-2xl relative ${className}`}>
      {children}
    </div>
  );
  export const DialogHeader = ({ children, className = '' }) => (
    <div className={`px-6 py-4 border-b ${className}`}>
      {children}
    </div>
  );
  
  export const DialogTitle = ({ children, className = '' }) => (
    <h2 className={`text-lg font-semibold ${className}`}>
      {children}
    </h2>
  );
  export const DialogDescription = ({ children, className = '' }) => (
    <p className={`text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed italic opacity-80 ${className}`}>
      {children}
    </p>
  );
  export const SelectContent = ({ children, isOpen, onValueChange, setIsOpen }) => {
    if (!isOpen) return null;
    return (
      <div className="absolute z-80 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
        {React.Children.map(children, child =>
          React.cloneElement(child, {
            onValueChange: (value) => {
              onValueChange(value);
              setIsOpen(false);
            }
          })
        )}
      </div>
    );
  };
  
  export const SelectItem = ({ children, value, onValueChange, className = '' }) => (
    <button
      onClick={() => onValueChange(value)}
      className={`w-full px-4 py-2 text-left text-black hover:bg-gray-100
        focus:outline-none focus:bg-gray-100 ${className}`}
    >
      {children}
    </button>
  );
  
  export const SelectValue = ({ placeholder }) => (
    <span className="text-gray-900">{placeholder}</span>
  );
  
  export const Select = ({ children, onValueChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (selectRef.current && !selectRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    return (
      <div ref={selectRef} className="relative">
        {React.Children.map(children, child =>
          React.cloneElement(child, {
            isOpen,
            setIsOpen,
            onValueChange
          })
        )}
      </div>
    );
  };
  
  export const SelectTrigger = ({ children, isOpen, setIsOpen, className = '' }) => (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={`w-full px-4 py-2 text-left border rounded-lg bg-white
        hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
        ${isOpen ? 'border-blue-500' : 'border-gray-300'}
        ${className}`}
    >
      {children}
    </button>
  );
  
  export const Table = ({ children, className = '' }) => (
    <div className={`w-full border border-gray-200 rounded-lg ${className}`}>
      {children}
    </div>
  );
  
  export const TableHeader = ({ children, className = '' }) => (
    <div className={`bg-gray-100 ${className}`}>
      {children}
    </div>
  );
  
  export const TableHead = ({ children, className = '' }) => (
    <div className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
      {children}
    </div>
  );
  
  export const TableBody = ({ children, className = '' }) => (
    <div className={`divide-y divide-gray-200 ${className}`}>
      {children}
    </div>
  );
  
  export const TableRow = ({ children, className = '' }) => (
    <div className={`hover:bg-gray-50 transition-colors ${className}`}>
      {children}
    </div>
  );
  
  export const TableCell = ({ children, className = '' }) => (
    <div className={`px-4 py-4 text-sm text-gray-900 ${className}`}>
      {children}
    </div>
  );
  
  export const Tabs = ({ children }) => (
    <div>
      {children}
    </div>
  );
  
  export const TabsList = ({ children, className = '' }) => (
    <div className={`flex space-x-2 bg-gray-100 p-1 rounded-lg ${className}`}>
      {children}
    </div>
  );
  
  export const TabsTrigger = ({ children, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
        ${active 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-200'
        }`}
    >
      {children}
    </button>
  );
  
  export const TabsContent = ({ children, active }) => (
    active ? <div>{children}</div> : null
  );
