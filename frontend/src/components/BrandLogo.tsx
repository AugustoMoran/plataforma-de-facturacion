import React from 'react';

const brandLogo = '/brand-logo.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  name?: string;
  className?: string;
}

const sizeMap = {
  sm: { shell: 'w-11 h-11', img: 'max-w-[1.75rem] max-h-[1.75rem]', text: 'text-sm' },
  md: { shell: 'w-14 h-14', img: 'max-w-[2.25rem] max-h-[2.25rem]', text: 'text-base' },
  lg: { shell: 'w-[4.5rem] h-[4.5rem]', img: 'max-w-[2.85rem] max-h-[2.85rem]', text: 'text-lg' },
  xl: { shell: 'w-20 h-20', img: 'max-w-[3.5rem] max-h-[3.5rem]', text: 'text-xl' },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showName = true,
  name,
  className = '',
}) => {
  const dims = sizeMap[size];
  const companyName = name || (import.meta as any).env?.VITE_COMPANY_NAME || 'Oso Sound';

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      <div
        className={`${dims.shell} rounded-full flex items-center justify-center flex-shrink-0 oso-logo-glow ring-2 ring-white/80 shadow-lg shadow-blue-500/30 overflow-hidden`}
        aria-hidden
      >
        <img
          src={brandLogo}
          alt=""
          className={`${dims.img} w-auto h-auto object-contain relative z-10`}
          draggable={false}
        />
      </div>
      {showName && (
        <span className={`${dims.text} font-bold text-blue-950 truncate tracking-tight`}>
          {companyName}
        </span>
      )}
    </div>
  );
};
