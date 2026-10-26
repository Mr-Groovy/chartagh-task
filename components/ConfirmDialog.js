'use client';
import Overlay from './Overlay';

// Destructive confirmation that names exactly what will be removed.
export default function ConfirmDialog({ title, text, action, onConfirm, onClose, children }) {
  return (
    <Overlay className="dialog" onClose={onClose} label={title}>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {children}
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--subtle" onClick={onClose}>
          انصراف
        </button>
        <button
          type="button"
          className="btn btn--danger-solid"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {action}
        </button>
      </div>
    </Overlay>
  );
}
