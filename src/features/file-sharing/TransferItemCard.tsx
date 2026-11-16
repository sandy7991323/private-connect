import React, { useState } from 'react';
import {
  FileText,
  Image,
  Film,
  Music,
  Archive,
  Code,
  File,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Eye,
} from 'lucide-react';
import { TransferItem } from '../../types';
import { formatBytes, formatSpeed, getFileCategory, triggerFileDownload } from '../../utils/file';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { p2pService } from '../../services/p2p/p2pService';
import { Modal } from '../../components/ui/Modal';

interface TransferItemCardProps {
  item: TransferItem;
}

export const TransferItemCard: React.FC<TransferItemCardProps> = ({ item }) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const category = getFileCategory(item.mimeType, item.name);

  const renderIcon = () => {
    switch (category) {
      case 'image':
        return <Image className="w-5 h-5 text-sky-400" />;
      case 'video':
        return <Film className="w-5 h-5 text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-emerald-400" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-amber-400" />;
      case 'code':
        return <Code className="w-5 h-5 text-cyan-400" />;
      case 'text':
      case 'pdf':
        return <FileText className="w-5 h-5 text-blue-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleAccept = () => {
    p2pService.sendFileResponse(item.id, true);
  };

  const handleReject = () => {
    p2pService.sendFileResponse(item.id, false, 'Rejected by recipient');
  };

  const handleCancel = () => {
    p2pService.cancelTransfer(item.id, 'Transfer cancelled by user');
  };

  const handleDownload = () => {
    if (item.blobUrl) {
      triggerFileDownload(item.blobUrl, item.name);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-3 transition-all hover:border-slate-700/80">
      {/* Top Header: Icon, Details, Badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
            {renderIcon()}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-medium text-slate-100 truncate" title={item.name}>
              {item.name}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{formatBytes(item.size)}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 font-mono">
                {item.direction === 'outgoing' ? (
                  <>
                    <ArrowUpRight className="w-3 h-3 text-brand-400" /> Outgoing
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-3 h-3 text-emerald-400" /> Incoming
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {item.status === 'completed' && (
            <Badge variant="success" size="sm">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
            </Badge>
          )}
          {item.status === 'transferring' && (
            <Badge variant="info" dot size="sm">
              Transferring
            </Badge>
          )}
          {item.status === 'pending_approval' && (
            <Badge variant="warning" dot size="sm">
              Action Required
            </Badge>
          )}
          {item.status === 'offered' && (
            <Badge variant="default" size="sm">
              Waiting for Peer
            </Badge>
          )}
          {item.status === 'rejected' && (
            <Badge variant="danger" size="sm">
              <XCircle className="w-3 h-3 mr-1" /> Rejected
            </Badge>
          )}
          {item.status === 'cancelled' && (
            <Badge variant="default" size="sm">
              Cancelled
            </Badge>
          )}
          {item.status === 'error' && (
            <Badge variant="danger" size="sm">
              <AlertCircle className="w-3 h-3 mr-1" /> Failed
            </Badge>
          )}
        </div>
      </div>

      {/* Progress & Speed (Active Transfer) */}
      {item.status === 'transferring' && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{Math.round(item.progress * 100)}%</span>
            <span>{formatSpeed(item.speed)}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-150"
              style={{ width: `${Math.round(item.progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Error or rejection notes */}
      {item.error && (
        <p className="text-xs text-rose-400/90 bg-rose-950/40 p-2 rounded border border-rose-900/50">
          {item.error}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
        {item.status === 'pending_approval' && (
          <>
            <Button size="sm" variant="danger" onClick={handleReject}>
              Reject
            </Button>
            <Button size="sm" variant="primary" onClick={handleAccept}>
              Accept File
            </Button>
          </>
        )}

        {item.status === 'transferring' && (
          <Button size="sm" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        )}

        {item.status === 'completed' && item.blobUrl && (
          <>
            {category === 'image' && (
              <Button
                size="sm"
                variant="ghost"
                icon={<Eye className="w-3.5 h-3.5" />}
                onClick={() => setShowPreviewModal(true)}
              >
                Preview
              </Button>
            )}
            <Button
              size="sm"
              variant="primary"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownload}
            >
              Download
            </Button>
          </>
        )}
      </div>

      {/* Image Preview Modal */}
      {item.blobUrl && category === 'image' && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={`Preview: ${item.name}`}
          maxWidth="lg"
        >
          <div className="flex flex-col items-center justify-center p-2">
            <img
              src={item.blobUrl}
              alt={item.name}
              className="max-h-[70vh] rounded-lg object-contain shadow-lg"
            />
            <div className="mt-4 flex justify-end w-full">
              <Button variant="primary" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleDownload}>
                Save File
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
