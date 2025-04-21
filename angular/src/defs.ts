import {Node} from "@jsplumbtoolkit/browser-ui"
import {ColorGenerator} from "./util"

export interface Task {
    id:string
    name:string
    color?:string
    parent:string|null
    type:string
    dependency?:string|Array<string>
    progress?:number
    milestone?:boolean

}

export interface ParsedTask extends Task {
    subtasks:Array<string>
    start:number
    end:number
    height:number
}

export interface InternalTask extends ParsedTask {
    dayRange:number
    size:number
    left:number
}

export interface SerializedTask extends Task {
    start:string|null
    end:string|null
}

export type SerializedGantt = Array<SerializedTask>

export type TimelineHeaderEntry = {values:Array<{start:number, end:number, label:string, size:number, id:string, type:string}>, id:string}

export interface TaskEntry {
    node:Node
    subtasks:Array<TaskEntry>
    id:string
}

export interface Gantt {
  zoomToFit():void
  assignColor():string
  barHeight:number
  minValue:number
  maxValue:number
  rowHeight:number
  addTask:(d:ParsedTask) => any
  entries:Array<TaskEntry>
  entryMap:Map<string, TaskEntry>
  dayNameFormat:"short"|"narrow"

  showDays:boolean
  showWeekOfYear:boolean
  showMonthNames:boolean
  showQuarter:boolean
  showDayName:boolean
  showDayNumber:boolean
}

export interface GanttOptions {
    timeline?:{
        showDays?:boolean
        showWeekOfYear?:boolean
        showMonthNames?:boolean
        showQuarters?:boolean
        dayNameFormat?:"short"|"narrow"
        showDayName?:boolean,
        showDayNumber?:boolean
    }
    rowHeight?:number
    barHeight?:number
    enableZoom?:boolean
    wheelPan?:boolean
    colorGenerator?:ColorGenerator
}

export interface GanttParserParameters {
    gantt:Gantt
}

export interface GanttExporterParameters {
    gantt:Gantt
}
