export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded">
        {children}
        <button onClick={onClose} className="mt-4 text-red-600">
          Close
        </button>
      </div>
    </div>
  );
}
