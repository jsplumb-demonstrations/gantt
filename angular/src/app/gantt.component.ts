import {AfterViewInit, Component, inject, Input, OnInit, ViewChild} from "@angular/core"
import {
  AngularRenderOptions,
  BrowserUIAngular,
  SurfaceComponent
} from "@jsplumbtoolkit/browser-ui-angular"
import {ColorGenerator, millisecondsToDays, pixelsToMilliseconds, RandomColorGenerator, today} from "../util"
import {GANTT, ROW_HEIGHT, STEP_WIDTH, TYPE_MILESTONE, TYPE_TASK, TYPE_TASK_GROUP} from "../constants"
import {TaskComponent} from "./task.component"
import {Gantt, GanttOptions, InternalTask} from "../defs"
import {ActiveFilteringPlugin,
  Node,
  EVENT_TAP,
  Base, Surface, PlainArrowOverlay,
  AnchorLocations,
  Edge,
  OrthogonalConnector,
  DrawingToolsPlugin,
  PointXY,
  Size,
  EVENT_CANVAS_CLICK,
  APPEND_TO_CURRENT,
  EVENT_NODE_UPDATED,
  UPDATE_NODE_REASON_MOVED,
  EVENT_NODE_REMOVED,
  JsPlumbToolkitOptions,
  Vertex,
  registerParser,
  registerExporter,
  registerDecorator
} from "@jsplumbtoolkit/browser-ui"
import {TaskGroupComponent} from "./task.group.component"
import {MilestoneComponent} from "./milestone.component"
import {BAR_HEIGHT, ONE_DAY_IN_MILLISECONDS} from "../constants"
import {ParsedTask, TaskEntry} from "../defs"

import {GanttDecorator} from "../decorator"
import {GanttParser} from "./parser"
import {GanttExporter} from "./exporter"
import {GanttService} from "./gantt.service"

@Component({
  selector:`jtk-gantt`,
  template:`<div class="jtk-gantt">
    <jsplumb-surface [surfaceId]="chartId"
                     [toolkitId]="chartId"
                     [view]="view"
                     [renderParams]="renderParams"
                     [toolkitParams]="toolkitParams"/>

  </div>`
})
export class GanttComponent implements Gantt, AfterViewInit, OnInit {

  @Input() chartId!:string
  @Input() options!:GanttOptions

  @ViewChild(SurfaceComponent) surfaceComponent!:SurfaceComponent;
  toolkit!:BrowserUIAngular
  surface!:Surface

  colorGenerator!:ColorGenerator

  step = ONE_DAY_IN_MILLISECONDS
  minValue = today()
  maxValue = today()
  rangeInDays = 0

  entries:Array<TaskEntry> = []
  entryMap:Map<string, TaskEntry> =  new Map()

  showDays!:boolean
  showWeekOfYear!:boolean
  showMonthNames!:boolean
  showQuarter!:boolean

  showDayNumber!:boolean
  showDayName!:boolean
  dayNameFormat!:"short"|"narrow"

  enableZoom!:boolean
  wheelPan!:boolean

  rowHeight!:number
  barHeight!:number

  ganttService = inject(GanttService)

  ngOnInit() {

    this.ganttService.register(this.chartId, this)

    registerParser(GANTT, GanttParser)
    registerExporter(GANTT, GanttExporter)
    registerDecorator(GANTT, GanttDecorator)

    const options = this.options || {}
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
  }

  ngAfterViewInit(): void {
    this.toolkit = this.surfaceComponent.surface.toolkitInstance
    this.surface = this.surfaceComponent.surface
    this.colorGenerator = new RandomColorGenerator()
    this.toolkit.bind(EVENT_NODE_UPDATED, (p) => {
      if(p.reason === UPDATE_NODE_REASON_MOVED) {
        this._taskMoved(p)
      }
    })

    this.toolkit.bind(EVENT_NODE_REMOVED, (p:{node:Node}) => {
      this._nodeRemoved(p.node)
    })

  }

  toolkitParams:JsPlumbToolkitOptions = {
    beforeConnect:(source:Vertex, target:Vertex) => {
      return source.id !== target.id
    }
  }

  renderParams:AngularRenderOptions = {
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
            const newStart = this.minValue + pixelsToMilliseconds(payload.left)
            const newEnd = newStart + pixelsToMilliseconds(payload.size)
            return {
              start:newStart,
              end:newEnd,
              dayRange:Math.floor(millisecondsToDays(newEnd - newStart))
            }
          },
          onEdit:(task:Node, surface:Surface) => {
            this._recalc(task)
            surface.relayout()
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
    events:{
      [EVENT_CANVAS_CLICK]:(surface:Surface) => {
        surface.toolkitInstance.clearSelection()
      }
    }
  }

  view = {
    nodes:{
      selectable:{
        events:{
          [EVENT_TAP]:(p:{obj:Base, toolkit:BrowserUIAngular}) => {
            p.toolkit.setSelection(p.obj)
          }
        },
        inputs:{
          chartId:() => this.chartId
        }
      },
      [TYPE_TASK]:{
        component:TaskComponent,
        parent:"selectable"
      },
      [TYPE_TASK_GROUP]:{
        component:TaskGroupComponent,
        parent:"selectable"
      },
      [TYPE_MILESTONE]:{
        component:MilestoneComponent,
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
              this.toolkit.removeEdge(e.edge)
            }
          }
        }
      }
    }
  }

  load(data:any) {

    this.toolkit.clear()

    this.entries.length = 0
    this.entryMap.clear()
    this.minValue = today()
    this.maxValue = today()
    this.rangeInDays = 0

    this.toolkit.load({
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

    const vertex = this.toolkit.addNode(t)
    const newEntry:TaskEntry = {node:vertex, subtasks:[], id:vertex.id}
    this.entryMap.set(vertex.id, newEntry)
    if (vertex.data['parent'] != null) {
      // @ts-ignore
      this.entryMap.get(vertex.data['parent']).subtasks.push(newEntry)
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

        this.toolkit.transaction(() => {
          tasks.forEach(t => this.toolkit.removeNode(t))
          groups.forEach(t => this.toolkit.removeNode(t))
        })


        this._relayoutTasks()
        this.surface.relayout()

      }
    }
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

      if (entry.node.data['parent'] != null) {
        const parentEntry = this.entryMap.get(entry.node.data['parent'])
        //@ts-ignore
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
  _relayoutTasks() {
    let y = 0
    this.toolkit.transaction(() => {
      const _one = (entry: TaskEntry) => {
        this.toolkit.updateNode(entry.id, {
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
      // @ts-ignore
      node = entry.node,
      // @ts-ignore
      subtasks = entry.subtasks

    let start = node.data['type'] === TYPE_TASK_GROUP ? Infinity : node.data['start']
    let end = node.data['type'] === TYPE_TASK_GROUP ? -Infinity : node.data['end']

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
    let taskGroupId = vertex.data['parent']
    while (taskGroupId != null) {
      const {start, end} = this._recalculateTaskDuration(taskGroupId)
      const dayRange = Math.floor((end - start) / ONE_DAY_IN_MILLISECONDS)
      this.toolkit.updateNode(taskGroupId, {
        start,
        end,
        dayRange,
        left:((start - this.minValue) / ONE_DAY_IN_MILLISECONDS) * STEP_WIDTH,
        size:dayRange * STEP_WIDTH
      })

      const taskGroup = this.toolkit.getNode(taskGroupId)
      taskGroupId = taskGroup.data['parent']
    }

    this._computeExtents()

  }

  private _computeExtents() {
    let _min = this.minValue, _max = this.maxValue
    const _one = function(entry:TaskEntry) {
      _min = Math.min(_min, entry.node.data['start'])
      _max = Math.max(_max, entry.node.data['end'])
      entry.subtasks.forEach(_one)
    }

    this.entries.forEach(_one)

    this.minValue = _min
    this.maxValue = _max
  }

  private _taskMoved(p:{vertex:Node}) {
    const startMillis = this.minValue + pixelsToMilliseconds(p.vertex.data['left'])
    const endMillis = startMillis + pixelsToMilliseconds(p.vertex.data['size'])
    const dayRange = millisecondsToDays(endMillis - startMillis)

    this.minValue = Math.min(startMillis, this.minValue)
    this.maxValue = Math.max(endMillis, this.maxValue)

    this.toolkit.updateNode(p.vertex, {
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

  exportToConsole() {
    return this.toolkit.exportData({type:GANTT, parameters:{gantt:this}})
  }

}
