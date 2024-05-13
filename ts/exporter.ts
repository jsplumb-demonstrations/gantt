import {Edge, Exporter, JsPlumbToolkit} from "@jsplumbtoolkit/browser-ui"
import {GanttExporterParameters, SerializedTask, Task, TaskEntry} from "./defs"
import {Gantt} from "./gantt"
import {TYPE_MILESTONE} from "./constants"

/**
 * Find the upstream dependencies for this task, if any
 * @param entry
 */
function getDependencies(toolkit:JsPlumbToolkit, entry:TaskEntry):Array<string> {

    return toolkit.getAllEdgesFor(entry.node, (e:Edge) => e.target === entry.node).map(e => e.source.id)
}

export function GanttExporter(toolkit: JsPlumbToolkit, parameters: GanttExporterParameters) {

    const out:Array<SerializedTask> = []

    const gantt:Gantt = parameters.gantt

    const _one = (entry:TaskEntry, parent?:TaskEntry) => {
        const t:SerializedTask = {
            id:entry.node.id,
            name:entry.node.data.name,
            color:entry.node.data.color,
            parent:parent == null ? null : parent.node.id,
            dependency:getDependencies(toolkit, entry),
            progress:entry.node.data.progress == null ? 0 : entry.node.data.progress,
            type:entry.node.type,
            milestone:entry.node.type === TYPE_MILESTONE,
            start:entry.node.data.start,
            end:entry.node.data.end
        }

        out.push(t)

        entry.subtasks.forEach(st => {
            _one(st, entry)
        })
    }

    gantt.entries.forEach(e => {
        _one(e, null)
    })

    return out

}
