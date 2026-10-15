"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface ToastContextType {
  toast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const toast = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-[26px] left-1/2 -translate-x-1/2 z-[200] max-w-[90vw] text-center bg-[#17161A] text-white px-6 py-3 rounded-xl text-[13.5px] font-semibold shadow-[0_24px_60px_-26px_rgba(23,22,26,.25)] transition-all duration-350 ${
            visible
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-8 pointer-events-none"
          }`}
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
