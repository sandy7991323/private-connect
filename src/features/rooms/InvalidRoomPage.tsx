import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const InvalidRoomPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
        <AlertOctagon className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-bold text-slate-100">Invalid Room Link</h2>
      <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
        The room identifier provided in the URL is malformed or does not meet the cryptographic
        length requirements. Please check that the entire link was copied correctly.
      </p>

      <div className="flex items-center gap-3 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Return Home
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/create')}
          icon={<Plus className="w-4 h-4" />}
        >
          Create New Room
        </Button>
      </div>
    </div>
  );
};
