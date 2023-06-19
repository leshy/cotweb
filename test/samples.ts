import { XML } from '../src/cotParser'
export const xml: { [key: string]: XML } = {}
import fs from 'fs'

xml.teamMember = fs.readFileSync('./test/samples/teamMember.xml', 'utf8')
xml.camera = fs.readFileSync('./test/samples/camera.xml', 'utf8')

export const camera = {
    "id": "bf4fe367-c422-403c-aaf0-918a5b6a8e63",
    "type": "Feature",
    "properties": {
        "callsign": "ivn.16.133249",
        "type": "b-m-p-s-p-loc",
        "how": "h-g-i-g-o",
        "time": "2023-06-16T11:37:45.047Z",
        "start": "2023-06-16T11:37:45.047Z",
        "stale": "2024-06-15T11:37:45.047Z"
    },
    "geometry": {
        "type": "Point",
        "coordinates": [
            "15.978569",
            "45.813012",
            "178.0"
        ]
    }
}
