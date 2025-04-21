/**
 * Gantt chart with a set of headers, and a list of tasks, optionally with tasks grouped by a parent.
 *
 * In the horizontal axis each task is granular to a day.
 *
 * Headers are stacked and can show:
 *
 * - Date / Date + Weekday name
 * - Week
 * - Month/ Month + year
 * - Quarter + year
 *
 */
import {ColorGenerator, RandomColorGenerator, today, todayPlus} from "./util"
import {
    BAR_HEIGHT,
    GANTT,
    ONE_DAY_IN_MILLISECONDS,
    ROW_HEIGHT,
    STEP_WIDTH, TYPE_MILESTONE,
    TYPE_TASK,
    TYPE_TASK_GROUP
} from "./constants"
import {
    EVENT_NODE_UPDATED,
    UPDATE_NODE_REASON_MOVED,
    newInstance,
    AbsoluteLayout,
    EVENT_TAP,
    PlainArrowOverlay,
    AnchorLocations,
    OrthogonalConnector,
    BlankEndpoint,
    DrawingToolsPlugin,
    BrowserElement,
    Surface,
    Node,
    BrowserUI,
    PointXY,
    Size,
    SurfaceObjectInfo,
    EVENT_NODE_REMOVED,
    APPEND_TO_CURRENT,
    Dialogs,
    uuid,
    EVENT_CANVAS_CLICK,
    ActiveFilteringPlugin,
    Edge,
    Base,
    registerParser,
    Decorators,
    registerExporter
} from "@jsplumbtoolkit/browser-ui"
import {buildMilestoneTemplate, buildTaskGroupTemplate, buildTaskTemplate} from "./template-builder"
import {GanttOptions, InternalTask, ParsedTask, TaskEntry} from "./defs"
import {GanttDecorator} from "./decorator"
import {_generateDialogTemplates, DIALOG_NEW_MILESTONE, DIALOG_NEW_TASK, DIALOG_NEW_TASK_GROUP} from "./dialogs"
import {GanttParser} from "./parser"
import {GanttExporter} from "./exporter"

registerParser(GANTT, GanttParser)
Decorators.register(GANTT, GanttDecorator)
registerExporter(GANTT, GanttExporter)

export class Gantt {

    jsplumb:BrowserUI
    surface:Surface

    step = ONE_DAY_IN_MILLISECONDS
    minValue = today()
    maxValue = today()
    rangeInDays = 0

    entries:Array<TaskEntry> = []
    entryMap:Map<string, TaskEntry> =  new Map()

    showDays:boolean
    showWeekOfYear:boolean
    showMonthNames:boolean
    showQuarter:boolean

    showDayNumber:boolean
    showDayName:boolean
    dayNameFormat:"short"|"narrow"

    enableZoom:boolean
    wheelPan:boolean

    rowHeight:number
    barHeight:number

    dialogs:Dialogs

    colorGenerator:ColorGenerator

    constructor(options?:GanttOptions) {

        options = options || {}
        options.timeline = options.timeline || {
            showDays:true,
            showWeekOfYear:true,
            showMonthNames:true,
            showQuarters:true,
            dayNameFormat:"short",
            showDayName:true,
            showDayNumber:true
        }

        this.colorGenerator = options.colorGenerator || new RandomColorGenerator()

        this.barHeight = options.barHeight || BAR_HEIGHT
        this.rowHeight = options.rowHeight || ROW_HEIGHT
        this.showDays = options.timeline.showDays !== false
        this.showWeekOfYear = options.timeline.showWeekOfYear !== false
        this.showMonthNames= options.timeline.showMonthNames !== false
        this.showQuarter = options.timeline.showQuarters !== false

        this.showDayNumber = options.timeline.showDayNumber !== false
        this.showDayName = options.timeline.showDayName !== false
        this.dayNameFormat = options.timeline.dayNameFormat || "short"

        this.enableZoom = options.enableZoom !== false
        this.wheelPan = options.wheelPan === true

        this.jsplumb = newInstance({
            beforeConnect:(source:Node, target:Node) => {
                return source.id !== target.id
            }
        })
        this.jsplumb.bind(EVENT_NODE_UPDATED, (p) => {
            if(p.reason === UPDATE_NODE_REASON_MOVED) {
                this._taskMoved(p)
            }
        })

        this.jsplumb.bind(EVENT_NODE_REMOVED, (p:{node:Node}) => {
            this._nodeRemoved(p.node)
        })

        this.dialogs = new Dialogs({
            dialogs:_generateDialogTemplates()
        })
    }

    render(container:BrowserElement) {

        this.surface = this.jsplumb.render(container, {
            layout:{
                type:AbsoluteLayout.type
            },
            view:{
                nodes:{
                    selectable:{
                        events:{
                            [EVENT_TAP]:(p:{obj:Base}) => {
                                this.jsplumb.setSelection(p.obj)
                            }
                        }
                    },
                    [TYPE_TASK]:{
                        template:buildTaskTemplate(true),
                        parent:"selectable"
                    },
                    [TYPE_TASK_GROUP]:{
                        template:buildTaskGroupTemplate(),
                        parent:"selectable"
                    },
                    [TYPE_MILESTONE]:{
                        template:buildMilestoneTemplate(),
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
                            [EVENT_TAP]:(e:{edge:Edge}) => {
                                if (confirm(`Delete dependency?`)) {
                                    this.jsplumb.removeEdge(e.edge)
                                }
                            }
                        }
                    }
                }
            },
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
                },
                endpoint:BlankEndpoint.type
            },
            dragOptions:{
                // this drag constrain function constrains the node to only drag in the X axis.

                constrainFunction:(desiredLoc: PointXY, dragEl: HTMLElement, constrainRect: Size, size: Size, currentLoc: PointXY) => {
                    return {x:Math.max(0, desiredLoc.x), y:currentLoc.y}
                },
                filter:".jtk-draw-handle, .jtk-gantt-day-stripe, .jtk-gantt-day-stripe-alt, .jtk-gantt-day-stripes"
            },
            consumeRightClick:false,
            plugins:[
                {
                    type:DrawingToolsPlugin.type,
                    options:{
                        widthAttribute:"size",
                        payloadGenerator:(node:Node, payload:InternalTask) => {
                            const newStart = this.minValue + this.pixelsToMilliseconds(payload.left)
                            const newEnd = newStart + this.pixelsToMilliseconds(payload.size)
                            return {
                                start:newStart,
                                end:newEnd,
                                dayRange:Math.floor(this.millisecondsToDays(newEnd - newStart))
                            }
                        },
                        onEdit:(task:Node) => {
                            this._recalc(task)
                            this.surface.relayout()
                        }
                    }
                },
                ActiveFilteringPlugin.type
            ],
            wheel:{
                zoom:this.enableZoom,
                pan:!this.enableZoom && this.wheelPan
            },
            decorators:[
                {
                    type:GANTT,
                    id:GANTT,
                    options:{
                        gantt:this
                    }
                }
            ],
            grid:{
                size:{w:STEP_WIDTH, h:ROW_HEIGHT}
            },
            modelEvents:[
                {
                    event:EVENT_TAP,
                    selector:".jtk-gantt-delete",
                    callback:<Vertex>(event: Event, eventTarget: BrowserElement, modelObject: SurfaceObjectInfo<Node>) => {
                        this.removeTask(modelObject.id)
                    }
                }
            ],
            events:{
                [EVENT_CANVAS_CLICK]:() => {
                    this.jsplumb.clearSelection()
                }
            }
        })
    }

    load(data:any) {

        this.jsplumb.clear()

        this.entries.length = 0
        this.entryMap.clear()
        this.minValue = today()
        this.maxValue = today()
        this.rangeInDays = 0

        this.jsplumb.load({
            data,
            type:GANTT,
            onload:() => {
                this._computeExtents()
                this.zoomToFit()
            },
            parameters: {
                gantt: this
            }
        })
    }


    addTask(data:ParsedTask) {
        if (data.parent != null && this.entryMap.get(data.parent) == null) {
            throw `Cannot add subtask ${data.name} to parent ${data.parent}; parent does not exist`
        }

        const dayRange = Math.floor((data.end - data.start) / ONE_DAY_IN_MILLISECONDS)
        const t:InternalTask = Object.assign(data as any, {
            dayRange,
            left:((data.start - this.minValue) / ONE_DAY_IN_MILLISECONDS) * STEP_WIDTH,
            size:dayRange * STEP_WIDTH
        })

        const vertex = this.jsplumb.addNode(t)
        const newEntry:TaskEntry = {node:vertex, subtasks:[], id:vertex.id}
        this.entryMap.set(vertex.id, newEntry)
        if (vertex.data.parent != null) {
            this.entryMap.get(vertex.data.parent).subtasks.push(newEntry)
        } else {
            this.entries.push(newEntry)
        }
    }

    /**
     * Remove the task with the given ID and update the char
     * @param taskId
     * @param noNeedToConfirm If true, the removal will be run without prompting the user to confirm.
     */
    removeTask(taskId:string, noNeedToConfirm?:boolean) {
        const entry = this.entryMap.get(taskId)
        if(entry != null) {

            const confirmationMessage = entry.node.type === TYPE_TASK ?
                `Delete task ${entry.node.data.name} ?` :
                entry.node.type === TYPE_TASK_GROUP ?
                `Delete task group ${entry.node.data.name} ? Group and all subtasks will be deleted!` :
                    `Delete milestone ${entry.node.data.name} ?`

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

                this.jsplumb.transaction(() => {
                    tasks.forEach(t => this.jsplumb.removeNode(t))
                    groups.forEach(t => this.jsplumb.removeNode(t))
                })


                this._relayoutTasks()
                this.surface.relayout()

            }
        }
    }

    addNewTask() {
        this._addNew(TYPE_TASK, DIALOG_NEW_TASK)
    }

    addNewTaskGroup() {
        this._addNew(TYPE_TASK_GROUP, DIALOG_NEW_TASK_GROUP)
    }

    addNewMilestone() {
        this._addNew(TYPE_MILESTONE, DIALOG_NEW_MILESTONE)
    }

    private _addNew(type:string, dialogId:string) {
        this.dialogs.show({
            id:dialogId,
            onOK:(data:Record<string, any>) => {

                if(data.parent != null && (data.parent.length === 0)) {
                    delete data.parent
                }

                data.start = today()
                data.end = todayPlus(1)
                data.subtasks = []
                data.id = uuid()
                data.color = this.assignColor()
                data.height = this.barHeight
                data.type = type
                data.progress = 0
                data.top = 0

                this.addTask(data as ParsedTask)

                this._relayoutTasks()
                this.surface.relayout()
            },
            data:{groups:this.jsplumb.getNodes().filter(n => n.data.type === TYPE_TASK_GROUP).map(n => n.data)}
        })
    }

    /**
     * Respond to the node removed event from JsPlumb. Here we do some internal housekeeping, to sync up
     * our internal entry set with the contents of the model.
     * @param n
     * @private
     */
    private _nodeRemoved(n:Node) {
        const entry = this.entryMap.get(n.id)
        if(entry != null) {

            if (entry.node.data.parent != null) {
                const parentEntry = this.entryMap.get(entry.node.data.parent)
                parentEntry.subtasks = parentEntry.subtasks.filter(st => st.id !== n.id)
            }

            this.entries = this.entries.filter(e => e.id !== n.id)
            this.entryMap.delete(n.id)
        }
    }

    /**
     * Relayout the tasks (and groups/milestones) vertically, and store the positions in the model.
     * @private
     */
    private _relayoutTasks() {
        let y = 0
        this.jsplumb.transaction(() => {
            const _one = (entry: TaskEntry) => {
                this.jsplumb.updateNode(entry.id, {
                    top: y + ((this.rowHeight - this.barHeight) / 2)
                })
                y += this.rowHeight
                entry.subtasks.forEach(_one)
            }

            this.entries.forEach(_one)
        }, APPEND_TO_CURRENT)

    }

    /**
     * Zoom and pan the display so that the content is centered in the viewport and line up the timeline headers with
     * the top edge of the viewport, and the task names with the left edge of the viewport, and then pan the task bar section
     * so that it does not overlap with any of the decoration.  This method uses `zoomToVisible()` which is a method available
     * on decorators from 6.23.0 onwards.
     */
    zoomToFit():void {
        const dec = this.surface.getDecorator(GANTT) as GanttDecorator
        dec.zoomToVisible()
    }

    /**
     * Recompute the duration of a group by finding the extents of the start/end dates of its subtasks.
     * @param taskGroupId
     * @private
     */
    private _recalculateTaskDuration(taskGroupId:string) {

        const entry = this.entryMap.get(taskGroupId),
            node = entry.node,
            subtasks = entry.subtasks

        let start = node.data.type === TYPE_TASK_GROUP ? Infinity : node.data.start
        let end = node.data.type === TYPE_TASK_GROUP ? -Infinity : node.data.end

        if (subtasks && subtasks.length > 0) {

            subtasks.forEach(st => {
                const std = this._recalculateTaskDuration(st.id)
                start = Math.min(start, std.start)
                end = Math.max(end, std.end)
            })
        }

        return {start, end}
    }

    private _recalc(vertex:Node) {
        let taskGroupId = vertex.data.parent
        while (taskGroupId != null) {
            const {start, end} = this._recalculateTaskDuration(taskGroupId)
            const dayRange = Math.floor((end - start) / ONE_DAY_IN_MILLISECONDS)
            this.jsplumb.updateNode(taskGroupId, {
                start,
                end,
                dayRange,
                left:((start - this.minValue) / ONE_DAY_IN_MILLISECONDS) * STEP_WIDTH,
                size:dayRange * STEP_WIDTH
            })

            const taskGroup = this.jsplumb.getNode(taskGroupId)
            taskGroupId = taskGroup.data.parent
        }

        this._computeExtents()

    }

    private _computeExtents() {
        let _min = this.minValue, _max = this.maxValue
        const _one = function(entry:TaskEntry) {
            _min = Math.min(_min, entry.node.data.start)
            _max = Math.max(_max, entry.node.data.end)
            entry.subtasks.forEach(_one)
        }

        this.entries.forEach(_one)

        this.minValue = _min
        this.maxValue = _max
    }

    private _taskMoved(p:{vertex:Node}) {
        const startMillis = this.minValue + this.pixelsToMilliseconds(p.vertex.data.left)
        const endMillis = startMillis + this.pixelsToMilliseconds(p.vertex.data.size)
        const dayRange = this.millisecondsToDays(endMillis - startMillis)

        this.minValue = Math.min(startMillis, this.minValue)
        this.maxValue = Math.max(endMillis, this.maxValue)

        this.jsplumb.updateNode(p.vertex, {
            start:startMillis,
            end:endMillis,
            dayRange
        })
        this._recalc(p.vertex)
        this.surface.relayout()
    }

    assignColor():string {
        return this.colorGenerator.generate()
    }

    pixelsToMilliseconds(px:number) {
        return  px / STEP_WIDTH * ONE_DAY_IN_MILLISECONDS
    }

    millisecondsToDays(ms:number) {
        return ms / ONE_DAY_IN_MILLISECONDS
    }

    export() {
        return this.jsplumb.exportData({type:GANTT, parameters:{gantt:this}})
    }
}
