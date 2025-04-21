import {BrowserUIReact, JsxWrapperProps} from "@jsplumbtoolkit/browser-ui-react"

import {Node, EVENT_TAP, Base, PlainArrowOverlay, Edge} from "@jsplumbtoolkit/browser-ui"

import {TYPE_MILESTONE, TYPE_TASK, TYPE_TASK_GROUP} from "./constants"
import TaskComponent from "./components/TaskComponent"
import TaskGroupComponent from "./components/TaskGroupComponent"
import MilestoneComponent from "./components/MilestoneComponent"


/**
 * Generates the view for the canvas - maps node types to JSX, sets up tap to select for nodes,
 * and configures edges.
 * @param toolkit
 * @param removeTask
 */
export function generateView(toolkit:BrowserUIReact, removeTask:(id:string)=> void) {
    return {
        nodes:{
            selectable:{
                events:{
                    [EVENT_TAP]:(p:{obj:Base, toolkit:BrowserUIReact}) => {
                        p.toolkit.setSelection(p.obj)
                    }
                }
            },
            [TYPE_TASK]:{
                jsx:(ctx:JsxWrapperProps<Node>) => <TaskComponent ctx={ctx} removeTask={removeTask}/>,
                parent:"selectable"
            },
            [TYPE_TASK_GROUP]:{
                jsx:(ctx:JsxWrapperProps<Node>) => <TaskGroupComponent ctx={ctx} removeTask={removeTask}/>,
                parent:"selectable"
            },
            [TYPE_MILESTONE]:{
                jsx:(ctx:JsxWrapperProps<Node>) => <MilestoneComponent ctx={ctx} removeTask={removeTask}/>,
                parent:"selectable"
            }
        },
        edges:{
            default:{
                overlays:[
                {
                    type:PlainArrowOverlay.type,
                    options:{
                        location:1,
                        width:8,
                        length:8
                    }
                }
            ],
                events:{
                [EVENT_TAP]:(e:{edge:Edge, toolkit:BrowserUIReact}) => {
                    if (confirm(`Delete dependency?`)) {
                        e.toolkit.removeEdge(e.edge)
                    }
                }
            }
        }
    }
}

}
