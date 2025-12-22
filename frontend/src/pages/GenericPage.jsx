import React from 'react';

const GenericPage = ({ title }) => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-4">
        {title}
      </h1>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚧</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Página en Construcción</h2>
          <p className="text-slate-500">El módulo <span className="font-medium text-purple-600">{title}</span> está en desarrollo.</p>
        </div>
      </div>
    </div>
  );
};

export default GenericPage;
