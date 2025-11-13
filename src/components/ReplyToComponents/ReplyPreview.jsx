import { X } from 'lucide-react';
import './ReplyPreview.scss';

const ReplyPreview = ({ message, onCancel }) => {
  return (
    <div className="reply-preview-container">
      <div className="reply-preview-content">
        <div className="reply-line"></div>
        <div className="reply-info">
          <div className="reply-to-sender">Replying to {message.sender}</div>
          <div className="reply-to-text">
            {message.text.length > 60
              ? `${message.text.substring(0, 60)}...`
              : message.text}
          </div>
        </div>
        <button className="cancel-reply-btn" onClick={onCancel}>
          <X size={18} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
};

export default ReplyPreview;
