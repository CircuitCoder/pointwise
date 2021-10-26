import { useEffect, useRef } from 'react';
import { State, Title } from './title';

export default function App(): JSX.Element {
  const title = useRef<Title>();
  useEffect(() => {
    if(title.current) title.current.drop();

    title.current = new Title('test', '被记忆和普通的花所祝福');
    title.current.fetchSpec();
  });

  return (
    <div className="app" onClick={() => {
      title.current?.changeState(State.Loading);
    }}>
    </div>
  );
}