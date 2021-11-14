import React, { ReactElement } from 'react';
import { useRoutes } from 'react-router-dom';
import About from './about';
import List from './list';

const Base = React.memo((): ReactElement => {
  const specialPage = useRoutes([
    {
      path: '/about',
      element: <About />,
    },
    {
      path: '/',
      element: <List />,
    }
  ]);

  return (
    <>
      {specialPage}
    </>
  )
});

export default Base;