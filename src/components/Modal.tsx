import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  overlayClassName?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, actions, overlayClassName = "bg-transparent" }) => {
  if (!isOpen) return null;
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayClassName}`} onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl border border-gray-300 p-6 max-w-md w-full relative"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        {title && <h2 id="modal-title" className="text-xl font-bold mb-4 text-black">{title}</h2>}
        <div className="mb-4">{children}</div>
        {actions && <div className="flex gap-2 justify-end">{actions}</div>}
      </div>
    </div>
  );
};

export default Modal; 