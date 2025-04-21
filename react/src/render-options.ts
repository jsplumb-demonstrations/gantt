import {Gantt, InternalTask} from "./defs"
import {GANTT, ROW_HEIGHT, STEP_WIDTH} from "./constants"

import { AnchorLocations,
    OrthogonalConnector,
    DrawingToolsPlugin,
    ActiveFilteringPlugin,
    EVENT_CANVAS_CLICK,
    Surface,
PointXY, Size, Node } from "@jsplumbtoolkit/browser-ui"
import {millisecondsToDays, pixelsToMilliseconds} from "./util"
import {RefObject} from "react"

export function createRenderOptions(gantt:Gantt, enableZoom:boolean, wheelPan:boolean, minValue:RefObject<number>, recalcTask:(task:Node) => void) {
    return {
        defaults:{
            anchors:[
                AnchorLocations.ContinuousRight, AnchorLocations.ContinuousLeft
            ],
            connector:{
                type:OrthogonalConnector.type,
                options:{
                    stub:15,
                    alwaysRespectStubs:true
                }
            }
        },
        dragOptions:{
            // this drag constrain function constrains the node to only drag in the X axis.
            constrainFunction:(desiredLoc: PointXY, dragEl: HTMLElement, constrainRect: Size, size: Size, currentLoc: PointXY) => {
                return {x:Math.max(0, desiredLoc.x), y:currentLoc.y}
            },
            filter:".jtk-gantt-day-stripe, .jtk-gantt-day-stripe-alt, .jtk-gantt-day-stripes"
        },
        consumeRightClick:false,
        plugins:[
            {
                type:DrawingToolsPlugin.type,
                options:{
                    widthAttribute:"size",
                    payloadGenerator:(node:Node, payload:InternalTask) => {
                        const newStart = minValue.current + pixelsToMilliseconds(payload.left)
                        const newEnd = newStart + pixelsToMilliseconds(payload.size)
                        return {
                            start:newStart,
                            end:newEnd,
                            dayRange:Math.floor(millisecondsToDays(newEnd - newStart))
                        }
                    },
                    onEdit:(task:Node, surface:Surface) => {
                        recalcTask(task)
                        surface.relayout()
                    }
                }
            },
            ActiveFilteringPlugin.type
        ],
        wheel:{
            zoom:enableZoom,
            pan:!enableZoom && wheelPan
        },
        decorators:[
            {
                type:GANTT,
                id:GANTT,
                options:{
                    gantt
                }
            }
        ],
        grid:{
            size:{w:STEP_WIDTH, h:ROW_HEIGHT}
        },
        events:{
            [EVENT_CANVAS_CLICK]:(surface:Surface) => {
                surface.toolkitInstance.clearSelection()
            }
        }
    }
}
