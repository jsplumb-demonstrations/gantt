import {BrowserUI, uuid} from "@jsplumbtoolkit/browser-ui"

import {parseDate} from "./util";
import {
    ONE_DAY_IN_MILLISECONDS,
    TYPE_TASK,
    TYPE_TASK_GROUP,
    TYPE_MILESTONE
} from "./constants"

import {GanttParserParameters, ParsedTask, SerializedGantt, SerializedTask, Task} from './defs'

export function GanttParser(data:SerializedGantt, toolkit:BrowserUI, parameters:GanttParserParameters) {

    let minDate = Infinity, maxDate = -Infinity

    const gantt = parameters.gantt

    let edges:Array<any> = [], nodes:Array<any> = [], nodeMap:Record<string, ParsedTask> = {}

    let rootId = uuid()
    const parentMap:Record<string, Array<any>> = {
        [rootId]:[]
    }

    function _registerParent(entry:Task) {
        let parentEntry = parentMap[rootId]
        if (entry.parent) {
            parentEntry = parentMap[entry.parent]
            if (parentEntry == null) {
                parentEntry = parentMap[entry.parent] = []
                nodeMap[entry.parent].type = TYPE_TASK_GROUP
            }
            nodeMap[entry.parent].subtasks.push(entry.id)
        }
        parentEntry.push(entry.id)
    }

    let x = 0, y = 0

    data.forEach((entry:SerializedTask) => {

        const start = entry.start ? parseDate(entry.start) : null
        const end = entry.end ? parseDate(entry.end) : start ? start + ONE_DAY_IN_MILLISECONDS : null

        if (start != null) {
            minDate = Math.min(minDate, start)
            maxDate = Math.max(minDate, end)
        }

        const node:ParsedTask = {
            id:entry.id,
            name:entry.name,
            color:gantt.assignColor(),
            start,
            end,
            height:gantt.barHeight,
            parent:entry.parent,
            subtasks:[],
            type:entry.milestone === true ? TYPE_MILESTONE : TYPE_TASK,
            progress:entry.progress == null ? 0 : entry.progress,
            milestone:entry.milestone === true
        }

        nodeMap[entry.id] = node

        _registerParent(entry)

        if (entry.dependency) {
            const deps = Array.isArray(entry.dependency) ? entry.dependency : [entry.dependency]
            deps.forEach(dep => edges.push({source:dep, target:entry.id}))
        }
    })

    /**
     * Calculates the effective start and end dates (and the day range) for the given task. For a task that has no subtasks
     * these dates are the entry's start and end dates (where the end date is the same as the start date
     * if the task is a milestone).  For a task that has subtasks the effective start date is the earliest
     * start date of any subtask of that task (nested to any level), and the effective end date is the latest
     * end date for any subtask. This method can also be used at the root level, since every task is a subtask
     * of the root.
     * @param entryId
     */
    function _calculateStartAndEnd(entryId:string) {
        const subtasks = parentMap[entryId]
        const node = nodeMap[entryId]
        let start = node.start || Infinity
        let end = node.end || -Infinity

        if (subtasks) {

            subtasks.forEach(st => {
                const std = _calculateStartAndEnd(st)
                start = Math.min(start, std.start)
                end = Math.max(end, std.end)
            })

        }

        node.start = start
        node.end = end

        return {start, end}
    }

    function _registerNodes(parentId:string) {
        const pe = parentMap[parentId]
        if (pe) {
            if (parentId !== rootId) {
                const se = _calculateStartAndEnd(parentId)

                minDate = Math.min(minDate, se.start)
                maxDate = Math.max(minDate, se.end)
            }
            pe.forEach(ce => {
                nodes.push(nodeMap[ce])
                _registerNodes(ce)
            })
        }
    }

    _registerNodes(rootId)

    gantt.minValue = minDate
    gantt.maxValue = maxDate

    nodes.forEach(node => {
        node.top = y + ((gantt.rowHeight - gantt.barHeight) / 2)
        gantt.addTask(node)
        y += gantt.rowHeight
    })

    edges.forEach(edge => toolkit.addEdge(edge))



}
