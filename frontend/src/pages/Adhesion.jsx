import React from 'react';
import MembershipSelector from '../components/MembershipSelector';

export default function Adhesion() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <MembershipSelector variant="dark" showTitle={true} />
      </div>
    </div>
  );
}
