import {Component, Input} from "@angular/core"
import {GanttService} from "./gantt.service"

@Component({
  selector:"jtk-gantt-controls",
  template:`<div class="jtk-gantt-controls">
    <button (click)="resetView()">HOME</button>
    <button (click)="addTask()">NEW TASK</button>
    <button (click)="addTaskGroup()">NEW TASK GROUP</button>
    <button (click)="addMilestone()">NEW MILESTONE</button>
    <button (click)="exportToConsole()">EXPORT TO CONSOLE</button>
  </div>
    
  `
})
export class GanttControlsComponent {

  @Input() chartId!:string

  constructor(private service:GanttService) { }

  resetView() {
    this.service.resetView(this.chartId)
  }

  addTask() {
    this.service.addNewTask(this.chartId)
  }

  addMilestone() {
    this.service.addNewMilestone(this.chartId)
  }

  addTaskGroup() {
    this.service.addNewTaskGroup(this.chartId)
  }

  exportToConsole() {
    this.service.exportToConsole(this.chartId)
  }
}
