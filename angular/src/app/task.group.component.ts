import {Component} from "@angular/core"
import {BAR_HEIGHT} from "../constants"
import {GanttService} from "./gantt.service"
import {BaseGanttTaskComponent} from "./base.task.component"

@Component({
  template:`<div class="jtk-gantt-task-group" data-jtk-target="true" style="left:{{obj.left}}px;width:{{obj.size}}px;height:${BAR_HEIGHT}px;background-color:{{obj.color}}" jtk-y-resize="false" jtk-x-resize="false" data-jtk-not-draggable="true">
                <div class="jtk-gantt-delete" (click)="deleteMe()">×</div>
                <div class="jtk-gantt-connect" data-jtk-source="true">+</div>
            </div>`
})
export class TaskGroupComponent extends BaseGanttTaskComponent {

  constructor(service:GanttService) {
    super(service)
  }

}
