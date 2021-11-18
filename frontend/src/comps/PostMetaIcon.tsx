import React, { PropsWithChildren, ReactElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  id: string,
  className?: string,
};

const PostMetaIcon = React.memo<PropsWithChildren<Props>>(({ children, id, className }): ReactElement => {
  return (
    <svg className={className} width="80" height="100" viewBox="0 0 80 100">
      <defs>
        <mask id={`${id}-mask`}>
          <rect width="100%" height="100%" fill="white" />
          <path d="M20 0, L80 0, L60 100, L0 100, Z" fill="black" />
          <text x="0" y="100" className="post-meta-icon-text" fill="white">{ children }</text>
        </mask>
        <mask id={`${id}-inverted-mask`}>
          <rect width="100%" height="100%" fill="white" />
          <rect width="100%" height="100%" fill="black" mask={`url(#${id}-mask)`} />
        </mask>
        <filter id="shadow-blur">
          <feGaussianBlur
            in="sourceGraphic"
            stdDeviation="3"
          />
        </filter>
      </defs>

      <rect width="100%" height="100%" fill="rgba(0,0,0,.1)" mask={`url(#${id}-inverted-mask)`} />
      <g mask={`url(#${id}-inverted-mask)`}>
        <g filter="url(#shadow-blur)" transform="translate(0, 3)">
          <rect width="100%" height="100%" fill="rgba(0,0,0,.3)" mask={`url(#${id}-mask)`} />
          <rect x="-10" y="0" height="100%" width="10" fill="black" />
          <rect x="100%" y="0" height="100%" width="10" fill="black" />
          <rect x="0" y="100%" height="10" width="100%" fill="black" />
        </g>
      </g>
    </svg>
  );
});

export default PostMetaIcon;