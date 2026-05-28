import React from 'react';
import { User } from '../types';
import LiveStreamAuction from './LiveStreamAuction';

interface LiveAuctionRoomProps {
  user: User | null;
  onRequestLogin: (reason: string) => void;
  verifiedPhones: string[];
}

export default function LiveAuctionRoom({ user, onRequestLogin, verifiedPhones }: LiveAuctionRoomProps) {
  return (
    <div className="space-y-6">
      <LiveStreamAuction 
        user={user} 
        onRequestLogin={onRequestLogin} 
        verifiedPhones={verifiedPhones} 
      />
    </div>
  );
}
