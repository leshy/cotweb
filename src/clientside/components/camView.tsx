import { get } from 'lodash'
import React from 'react';
import './camView.css';
import { COT, nameFromCot } from '../base'

export function getUrl(entity: COT): string | null {
    console.log(nameFromCot(entity))
    if (nameFromCot(entity) == "Ev.cam1") {
        return "/images/ev.cam1.jpg"
    }

    const video = get(entity, 'detail.__video')

    if (!video) { return null }
    // @ts-ignore
    return video.url
}

export function CamView({ entities, isExpanded }: { entities: { [uid: string]: COT }, isExpanded: string | void }) {
    if (!isExpanded) return null

    const entity = entities[isExpanded]
    const url = getUrl(entity)
    console.log("URL", url)
    if (!url) return null

    // @ts-ignore
    return <div className="camView"><img src={url} /></div>
}

export default CamView
