import React, { ReactElement, useEffect, useState } from "react";
import ListEnt from "../comps/ListEnt";
import { taxonomy } from "../content";

import SPEC from '../test.json';

const List = React.memo((): ReactElement => {
  const [list, setList] = useState<any>(null);
  useEffect(() => {
    taxonomy.then(t => setList(t.entries));
  });

  if(!list) return <div></div>;

  return (
    <div className="page list">
      {list.map((ent: any) => (<ListEnt spec={ent.title_outline} id={ent.id} />))}
    </div>
  );
});

export default List;