import React from 'react';

const brandLogo = '/brand-logo.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  name?: string;
  className?: string;
}

const sizeMap = {
  sm: { shell: 'w-11 h-11', img: 'w-7 h-7', text: 'text-sm' },
  md: { shell: 'w-14 h-14', img: 'w-9 h-9', text: 'text-base' },
  lg: { shell: 'w-16 h-16', img: 'w-11 h-11', text: 'text-lg' },
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
        className={`${dims.shell} rounded-full flex items-center justify-center flex-shrink-0 oso-logo-glow ring-2 ring-white/80 shadow-lg shadow-blue-500/30`}
        aria-hidden
      >
        <img src={brandLogo} alt="" className={`${dims.img} object-contain relative z-10`} />
      </div>
      {showName && (
        <span className={`${dims.text} font-bold text-blue-950 truncate tracking-tight`}>
          {companyName}
        </span>
      )}
    </div>
  );
};
