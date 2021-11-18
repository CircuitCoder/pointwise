import React, { ReactElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useMatch } from 'react-router-dom';

import BrandDot from './BrandDot';

const Header = React.memo((): ReactElement => {
  const ref = useRef<HTMLElement>(null);

  const postMatch = useMatch('/post/:id');

  const isMini = !!postMatch;
  const lastIsMini = useRef(isMini);

  useEffect(() => {
    if(!ref.current) return;
    // Initial render
    if(isMini === lastIsMini.current) return;

    const elem = ref.current;
    
    lastIsMini.current = isMini;

    if(isMini) {
      // Minimize
      const loc = elem.getBoundingClientRect();
      elem.classList.add('header-fixed');
      elem.animate([
        {
          transform: `translate(${loc.left}px, ${loc.top}px)`,
        }, {
          transform: 'none',
        }
      ], {
        duration: 1000,
        easing: 'ease',
        fill: 'both',
      });
    } else {
      // Expand
      elem.classList.remove('header-fixed');
      const loc = elem.getBoundingClientRect();
      elem.animate([
        {
          transform: `translate(${-loc.left}px, ${-loc.top}px)`,
        }, {
          transform: 'none',
        }
      ], {
        duration: 1000,
        easing: 'ease',
        fill: 'both',
      });
    }
  }, [isMini]);

  return (
    <header ref={ref}>
      <div className="brand">
        <BrandDot />
        <div className="brand-text">
          <h1 className="brand-text-main">
            点测量
            <small>
              &nbsp;:: BlogOf&lt;Meow&gt;
            </small>
          </h1>

          <nav>
            <NavLink to="/">文章</NavLink>
            <span className="nav-split">/</span>
            <NavLink to="/taxonomy">索引</NavLink>
            <span className="nav-split">/</span>
            <NavLink to="/about">关于</NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
});

export default Header;