import React, { ReactElement } from 'react';
import { useMatch } from 'react-router-dom';
import About from './about';
import List from './list';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

const Base = React.memo((): ReactElement => {
  const aboutMatch = useMatch('/about');
  const indexMatch = useMatch({
    path: '/',
    end: true,
  });

  return (
    <>
      <TransitionGroup>
        {aboutMatch && (
          <CSSTransition key="about" timeout={750} classNames="pages">
            <About />
          </CSSTransition>
        )}
        {indexMatch && (
          <CSSTransition key="index" timeout={750} classNames="pages">
            <List />
          </CSSTransition>
        )}
      </TransitionGroup>
    </>
  )
});

export default Base;