import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Logo({
  to = '/',
  sizeClassName = 'h-8 sm:h-10 md:h-12 lg:h-14',
  className = '',
  imgClassName = '',
  loading = 'eager',
  showFallbackText = true,
}) {
  const [failed, setFailed] = useState(false);
  const src = '/assets/logo.png';

  const content = useMemo(() => {
    if (failed) {
      if (!showFallbackText) return null;
      return (
        <span className="font-extrabold tracking-tight text-gray-900">
          GRIN17
        </span>
      );
    }
    return (
      <img
        src={src}
        alt="GRIN17 Logo"
        className={`${sizeClassName} w-auto object-contain max-w-[180px] ${imgClassName}`}
        loading={loading}
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }, [failed, imgClassName, loading, showFallbackText, sizeClassName]);

  const wrapperClass = `inline-flex items-center ${className}`;

  if (!to) {
    return <div className={wrapperClass}>{content}</div>;
  }

  return (
    <Link to={to} aria-label="Homepage" className={wrapperClass}>
      {content}
    </Link>
  );
}

