import {Gantt, GanttOptions, InternalTask, ParsedTask, TaskEntry} from "./defs"
import {RefObject, useContext, useEffect, useRef} from "react"

import { registerParser, registerExporter,
    registerDecorator,
    newInstance,
    Vertex,
    Node,
    APPEND_TO_CURRENT, EVENT_NODE_REMOVED,
    EVENT_NODE_UPDATED, UPDATE_NODE_REASON_MOVED
} from "@jsplumbtoolkit/browser-ui"

import {GanttParser} from "./parser"
import {
    BAR_HEIGHT,
    GANTT,
    ONE_DAY_IN_MILLISECONDS,
    ROW_HEIGHT,
    STEP_WIDTH,
    TYPE_TASK,
    TYPE_TASK_GROUP
} from "./constants"
import {GanttExporter} from "./exporter"
import {GanttDecorator} from "./decorator"

import {RandomColorGenerator, today} from "./util"
import {SurfaceComponent} from "@jsplumbtoolkit/browser-ui-react"

import {subtaskDataset} from "./data-generator"
import {GanttContext} from "./GanttProvider"
import {generateView} from "./view"
import { createRenderOptions } from "./render-options"
import {millisecondsToDays, pixelsToMilliseconds} from "../../angular/src/util"

export default function GanttChart(props:GanttOptions) {

    registerParser(GANTT, GanttParser)
    registerExporter(GANTT, GanttExporter)
    registerDecorator(GANTT, GanttDecorator)

    const surfaceComponent = useRef(null)
    const surface = useRef(null)

    const entries:RefObject<Array<TaskEntry>> = useRef([])
    const entryMap:RefObject<Map<string, TaskEntry>> =  useRef(new Map())

    const initialized = useRef(false)
    const toolkit = useRef(newInstance({
        beforeConnect:(source:Vertex, target:Vertex) => {
            return source.id !== target.id
        }
    }))

    toolkit.current.bind(EVENT_NODE_REMOVED, (p:{node:Node}) => {
        _nodeRemoved(p.node)
    })

    toolkit.current.bind(EVENT_NODE_UPDATED, (p) => {
        if(p.reason === UPDATE_NODE_REASON_MOVED) {
            _taskMoved(p)
        }
    })

    function assignColor():string {
        return colorGenerator.current.generate()
    }

    function exportToConsole() {
        console.log(JSON.stringify(toolkit.current.exportData({type:GANTT, parameters:{gantt}}), 2))
    }

    function _taskMoved(p:{vertex:Node}) {
        const startMillis = minValue.current + pixelsToMilliseconds(p.vertex.data['left'])
        const endMillis = startMillis + pixelsToMilliseconds(p.vertex.data['size'])
        const dayRange = millisecondsToDays(endMillis - startMillis)

        minValue.current = Math.min(startMillis, minValue.current)
        maxValue.current = Math.max(endMillis, maxValue.current)

        toolkit.current.updateNode(p.vertex, {
            start:startMillis,
            end:endMillis,
            dayRange
        })
        _recalc(p.vertex)
        surface.current.relayout()
    }

    function _recalculateTaskDuration(taskGroupId:string) {

        const entry = entryMap.current.get(taskGroupId),
            // @ts-ignore
            node = entry.node,
            // @ts-ignore
            subtasks = entry.subtasks

        let start = node.data['type'] === TYPE_TASK_GROUP ? Infinity : node.data['start']
        let end = node.data['type'] === TYPE_TASK_GROUP ? -Infinity : node.data['end']

        if (subtasks && subtasks.length > 0) {

            subtasks.forEach(st => {
                const std = _recalculateTaskDuration(st.id)
                start = Math.min(start, std.start)
                end = Math.max(end, std.end)
            })
        }

        return {start, end}
    }

    function _recalc(vertex:Node) {
        let taskGroupId = vertex.data['parent']
        while (taskGroupId != null) {
            const {start, end} = _recalculateTaskDuration(taskGroupId)
            const dayRange = Math.floor((end - start) / ONE_DAY_IN_MILLISECONDS)
            toolkit.current.updateNode(taskGroupId, {
                start,
                end,
                dayRange,
                left:((start - minValue.current) / ONE_DAY_IN_MILLISECONDS) * STEP_WIDTH,
                size:dayRange * STEP_WIDTH
            })

            const taskGroup = toolkit.current.getNode(taskGroupId)
            taskGroupId = taskGroup.data['parent']
        }

        _computeExtents()

    }

    function _computeExtents() {
        let _min = minValue.current, _max = maxValue.current
        const _one = function(entry:TaskEntry) {
            _min = Math.min(_min, entry.node.data['start'])
            _max = Math.max(_max, entry.node.data['end'])
            entry.subtasks.forEach(_one)
        }

        entries.current.forEach(_one)

        minValue.current = _min
        maxValue.current = _max
    }

    const options = Object.assign({}, props || {})

    const colorGenerator = useRef(options.colorGenerator || new RandomColorGenerator())

    const minValue = useRef(today())
    const maxValue = useRef(-today())
    const rangeInDays = useRef(0)

    const gantt:Gantt = {
        zoomToFit:() => zoomToFit(),
        assignColor:() => colorGenerator.current.generate(),
        barHeight:options.barHeight || BAR_HEIGHT,
        minValue,
        maxValue,
        rowHeight:options.rowHeight || ROW_HEIGHT,
        addTask,
        entries:entries.current,
        entryMap:entryMap.current,
        showDays:options.timeline ? options.timeline.showDays !== false : true,
        showWeekOfYear:options.timeline ? options.timeline.showWeekOfYear !== false : true,
        showMonthNames:options.timeline ? options.timeline.showMonthNames !== false : true,
        showQuarter:options.timeline ? options.timeline.showQuarters !== false : true,
        showDayName:options.timeline ? options.timeline.showDayName !== false : true,
        showDayNumber:options.timeline ? options.timeline.showDayNumber !== false : true,
        dayNameFormat:options.timeline ? options.timeline.dayNameFormat || "short" : "short",
        exportToConsole,
        toolkit:toolkit.current,
        relayoutTasks:_relayoutTasks,
        getSurface:() => surface.current
    }

    // store the gantt object on the context
    useContext(GanttContext).set(gantt)

    function _nodeRemoved(n:Node) {
        const entry = entryMap.current.get(n.id)
        if(entry != null) {

            if (entry.node.data['parent'] != null) {
                const parentEntry = entryMap.current.get(entry.node.data['parent'])
                //@ts-ignore
                parentEntry.subtasks = parentEntry.subtasks.filter(st => st.id !== n.id)
            }

            entries.current = entries.current.filter(e => e.id !== n.id)
            entryMap.current.delete(n.id)
        }
    }

    function zoomToFit():void {
        const dec = surface.current.getDecorator(GANTT) as GanttDecorator
        dec.zoomToVisible()
    }

    function load(data:any) {

        toolkit.current.clear()

        entries.current.length = 0
        entryMap.current.clear()
        minValue.current = today()
        maxValue.current = today()
        rangeInDays.current = 0

        toolkit.current.load({
            data,
            type:GANTT,
            onload:() => {
                _computeExtents()
                setTimeout(zoomToFit, 250)
            },
            parameters: {
                gantt
            }
        })
    }

    function addTask(data:ParsedTask) {
        if (data.parent != null && entryMap.current.get(data.parent) == null) {
            throw `Cannot add subtask ${data.name} to parent ${data.parent}; parent does not exist`
        }

        const dayRange = Math.floor((data.end - data.start) / ONE_DAY_IN_MILLISECONDS)
        const t:InternalTask = Object.assign(data as any, {
            dayRange,
            left:((data.start - minValue.current) / ONE_DAY_IN_MILLISECONDS) * STEP_WIDTH,
            size:dayRange * STEP_WIDTH
        })

        const vertex = toolkit.current.addNode(t)
        const newEntry:TaskEntry = {node:vertex, subtasks:[], id:vertex.id}
        entryMap.current.set(vertex.id, newEntry)
        if (vertex.data['parent'] != null) {
            // @ts-ignore
            entryMap.current.get(vertex.data['parent']).subtasks.push(newEntry)
        } else {
            entries.current.push(newEntry)
        }
    }

    function removeTask(taskId:string, noNeedToConfirm?:boolean) {
        const entry = entryMap.current.get(taskId)
        if(entry != null) {

            const confirmationMessage = entry.node.type === TYPE_TASK ?
                `Delete task ${entry.node.data['name']} ?` :
                entry.node.type === TYPE_TASK_GROUP ?
                    `Delete task group ${entry.node.data['name']} ? Group and all subtasks will be deleted!` :
                    `Delete milestone ${entry.node.data['name']} ?`

            if (noNeedToConfirm || confirm(confirmationMessage)) {

                const tasks:Array<Node> = [], groups:Array<Node> = []

                const _one = (entry:TaskEntry) => {
                    if (entry.node.type === TYPE_TASK) {
                        tasks.unshift(entry.node)
                    } else {
                        groups.unshift(entry.node)
                    }
                    entry.subtasks.forEach(st => _one(st))
                }

                _one(entry)

                toolkit.current.transaction(() => {
                    tasks.forEach(t => toolkit.current.removeNode(t))
                    groups.forEach(t => toolkit.current.removeNode(t))
                })

                _relayoutTasks()
            }
        }
    }

    function _relayoutTasks() {
        let y = 0
        toolkit.current.transaction(() => {
            const _one = (entry: TaskEntry) => {
                toolkit.current.updateNode(entry.id, {
                    top: y + ((gantt.rowHeight - gantt.barHeight) / 2)
                })
                y += gantt.rowHeight
                entry.subtasks.forEach(_one)
            }

            entries.current.forEach(_one)
        }, APPEND_TO_CURRENT)

        surface.current.relayout()

    }

    useEffect(() => {
        if(!initialized.current) {
            initialized.current = true
            surface.current = surfaceComponent.current.getSurface()

            load(subtaskDataset())
        }
    })

    const viewOptions = generateView(toolkit.current, removeTask)
    const renderOptions = createRenderOptions(gantt, options.enableZoom !== false, options.wheelPan === true, minValue, _recalc)

    return <div className="jtk-gantt">
        <SurfaceComponent viewOptions={viewOptions}
                          renderOptions={renderOptions}
                          toolkit={toolkit.current} ref={surfaceComponent}/>
    </div>
}
