import {RefHandle, createRefHandler} from "@jsplumbtoolkit/browser-ui-react"
import {Context, createContext, RefObject, ReactNode, useRef, useState} from "react"

import {Gantt} from "./defs"

export const GanttContext:Context<RefHandle<Gantt>> = createContext(null as RefHandle<Gantt>)

export function GanttProvider(props:{children?:Array<ReactNode>|ReactNode}) {

    const ganttRefObject:RefObject<Gantt|null> = useRef(null)
    const ganttHarness = createRefHandler<Gantt>(ganttRefObject)

    return <GanttContext.Provider value={ganttHarness}>{props.children || []}</GanttContext.Provider>
}
