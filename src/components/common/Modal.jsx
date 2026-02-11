import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* title이 있을 때만 헤더 렌더링 */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b flex-shrink-0 bg-white">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* children 영역 */}
        <div className={title ? "p-6 overflow-y-auto" : "overflow-y-auto"}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
