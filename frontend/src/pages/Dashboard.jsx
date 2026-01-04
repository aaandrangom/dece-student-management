import React from 'react';
import { CalendarDays } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans animate-in fade-in duration-300">
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays className="w-7 h-7 text-indigo-600" /> Panel Principal
            </h1>
            <p className="text-slate-500 text-sm mt-1">Bienvenido al sistema.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;