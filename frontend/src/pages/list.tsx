import React, { ReactElement } from "react";
import ListEnt from "../comps/ListEnt";

import SPEC from '../test.json';

const List = React.memo((): ReactElement => {
  return (
    <div className="list">
      <ListEnt spec={SPEC} />
    </div>
  );
});

export default List;