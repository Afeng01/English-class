import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : CheckCircle;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className={`${typeStyles[type]} px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[500px]`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1 font-medium">{message}</span>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
