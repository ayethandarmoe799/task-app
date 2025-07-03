import React from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

const typeStyles = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-blue-600 text-white",
};

const Toast: React.FC<ToastProps> = ({ message, type = "info", onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded shadow-lg flex items-center gap-2 ${typeStyles[type]}`}
      role="alert"
      aria-live="assertive"
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white font-bold" aria-label="Close">&times;</button>
    </div>
  );
};

export default Toast; 