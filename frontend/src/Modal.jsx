import React, { useEffect, useRef } from 'react';

/**
 * Accessible, reusable Modal wrapper for CampusEdge
 * Implements WAI-ARIA dialog standards, focus trapping, Escape key support, and scroll lock.
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  titleId = 'modal-title',
  descriptionId,
  maxWidth = 'max-w-lg',
  className = '',
  closeOnEscape = true,
  closeOnBackdropClick = true,
  zIndex = 'z-[99999]',
  showCloseButton = false
}) {
  const modalRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Store previously focused element to restore focus on modal close
    previousActiveElementRef.current = document.activeElement;

    // Prevent background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first interactive element inside modal
    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    // Keyboard Event Listener: Escape & Focus Trap
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && closeOnEscape && onClose) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement || document.activeElement === modalRef.current) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      // Restore previous focus
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdropClick && onClose) {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 ${zIndex} bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in`}
      onClick={handleBackdropClick}
      aria-hidden={!isOpen}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={descriptionId}
        tabIndex="-1"
        className={`bg-white dark:bg-slate-900 rounded-3xl ${maxWidth} w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white space-y-6 animate-scale-up relative outline-none ${className}`}
      >
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 dark:hover:text-white font-black text-sm w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
