import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSecureRoomId } from '../../utils/crypto';

export const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const roomId = generateSecureRoomId();
    navigate(`/waiting/${roomId}`, { replace: true });
  }, [navigate]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className="text-sm font-medium text-slate-300">Generating secure room token...</h2>
    </div>
  );
};
