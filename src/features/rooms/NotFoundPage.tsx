import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
        <Compass className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-bold text-slate-100">Page Not Found</h2>
      <p className="text-xs sm:text-sm text-slate-400 mt-2">
        The requested address does not exist on this application.
      </p>

      <Button
        variant="primary"
        size="sm"
        onClick={() => navigate('/')}
        icon={<Home className="w-4 h-4" />}
        className="mt-6"
      >
        Back to Home
      </Button>
    </div>
  );
};
