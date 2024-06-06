import {ColorGenerator} from "../util"

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
