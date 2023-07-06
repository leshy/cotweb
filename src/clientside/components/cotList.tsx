import './cotList.css';

import { map } from 'lodash'
import React, { useState } from 'react';
import { COT, nameFromCot, renderTimes } from '../base'
import JSONPretty from 'react-json-pretty';
const theme = require('react-json-pretty/themes/adventure_time.css');

/* const theme = {
*     main: 'line-height:1.3;color:#1a1a1a;overflow:auto;', // Very Dark Grey for main text
*     error: 'line-height:1.3;color:#c0392b;overflow:auto;', // Dark Red for errors
*     key: 'color:#2980b9;', // Dark Sky Blue for keys
*     string: 'color:#27ae60;', // Dark Emerald Green for strings
*     value: 'color:#8e44ad;', // Dark Amethyst Purple for values
*     boolean: 'color:#f39c12;', // Dark Sunflower Yellow for booleans
* }
*  */

type Callback = (uid: string) => any

function CotEntry({ entity, callback, isExpanded }: { entity: COT, callback: Callback, isExpanded: void | string }) {
    function handler() { callback(entity.uid) }
    return <li key={entity.uid} onClick={handler} className={(isExpanded == entity.uid) ? "expanded" : ""}>
        <div className="row">{nameFromCot(entity)}</div>
    </li>
}

function ExpandedCotEntry({ entity }: { entity: COT }) {
    return <div id="cotDetails" className="cotDetails">
        <JSONPretty data={renderTimes(entity)} theme={theme} ></JSONPretty>
    </div>
}

export function CotList({ entities, setExpanded, isExpanded }: { entities: { [uid: string]: COT } }) {
    //    const [isExpanded, setExpanded] = useState<string | void>(undefined);

    const handler = (uid: string) =>
        (uid == isExpanded) ? setExpanded(undefined) : setExpanded(uid)

    const listItems: Array<React.JSX.Element> = map(
        entities,
        // @ts-ignore
        ((entity: COT) => <CotEntry key={entity.uid} entity={entity} isExpanded={isExpanded} callback={handler} />))


    return <div className="container">
        <div className="cotList"><ul>{listItems}</ul></div>
        {isExpanded ? <ExpandedCotEntry entity={entities[isExpanded]} /> : <div />}
    </div>

}

export default CotList
