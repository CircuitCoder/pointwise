import React, { ReactElement } from 'react';
import { useMatch } from 'react-router-dom';
import About from './about';
import List from './list';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import Post from './post';

const Base = React.memo((): ReactElement => {
  const aboutMatch = useMatch('/about');
  const indexMatch = useMatch({
    path: '/',
    end: true,
  });
  const postMatch = useMatch({
    path: '/post/:id',
    end: true,
  });

  const listCls = postMatch ? 'blur' : 'pages';

  // TODO: manually do transitions
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
        {postMatch && (
          <CSSTransition key={`post-${postMatch.params.id}`} timeout={750} classNames="pages">
            <Post />
          </CSSTransition>
        )}
      </TransitionGroup>
    </>
  )
});

export default Base;