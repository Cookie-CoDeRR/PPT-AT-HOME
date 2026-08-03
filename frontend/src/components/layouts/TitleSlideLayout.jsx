import React from 'react';

export default function TitleSlideLayout({ slide }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center relative overflow-hidden">
      {/* Decorative gradient blur behind the title */}
      <div className="absolute w-[120%] h-64 bg-gradient-to-r from-violet-600/30 via-fuchsia-600/30 to-violet-600/30 blur-3xl -z-10 rounded-full" />
      
      <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300 leading-tight mb-6 px-12">
        {slide.title}
      </h1>
      
      {slide.subtitle && (
        <p className="text-xl md:text-2xl text-violet-300/80 font-medium max-w-3xl px-12">
          {slide.subtitle}
        </p>
      )}
    </div>
  );
}
