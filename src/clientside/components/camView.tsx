import { get } from 'lodash'
import React from 'react';
import './camView.css';
import { COT } from '../base'

export function CamView({ entities, isExpanded }: { entities: { [uid: string]: COT }, isExpanded: string | void }) {
    if (!isExpanded) return null

    const entity = entities[isExpanded]
    const video = get(entity, 'detail.__video')

    if (!video) return null

    // @ts-ignore
    return <div className="camView"><img src={video.url + "&date=" + Date.now()} /></div>
}

export default CamView
