import './cotList.css';

import { map } from 'lodash'
import React, { useState } from 'react';
import { COT, nameFromCot, renderTimes } from '../base'
import JSONPretty from 'react-json-pretty';

type Callback = (uid: string) => any

function CotEntry({ entity, callback, isExpanded }: { entity: COT, callback: Callback, isExpanded: void | string }) {
    function handler() { callback(entity.uid) }
    return <li key={entity.uid} onClick={handler} className={(isExpanded == entity.uid) ? "expanded" : ""}>
        <div className="row">{nameFromCot(entity)}</div>
    </li>
}

function ExpandedCotEntry({ entity }: { entity: COT }) {
    return <div className="cotDetails">
        <JSONPretty data={renderTimes(entity)} ></JSONPretty>
    </div>
}

export function CotList({ entities }: { entities: Array<COT> }) {
    const [isExpanded, setExpanded] = useState<string | void>(undefined);

    const handler = (uid: string) =>
        (uid == isExpanded) ? setExpanded(undefined) : setExpanded(uid)

    const listItems: Array<React.JSX.Element> = map(
        entities,
        // @ts-ignore
        ((entity: COT) => <CotEntry entity={entity} isExpanded={isExpanded} callback={handler} />))


    const list = <div className="cotList"><ul>{listItems}</ul></div>

    return <div className="container">
        {list}
        {isExpanded ? <ExpandedCotEntry entity={entities[isExpanded]} /> : <div />}
    </div>

}

export default CotList
