import { BaseNodeComponent } from "@jsplumbtoolkit/browser-ui-angular"
import {Component} from "@angular/core"
import {BAR_HEIGHT} from "../constants"
import {GanttService} from "./gantt.service"
import {BaseGanttTaskComponent} from "./base.task.component"

@Component({
  template:`<div class="jtk-gantt-task" data-jtk-target="true" style="left:{{obj.left}}px;width:{{obj.size}}px;height:${BAR_HEIGHT}px;background-color:{{obj.color}}" jtk-y-resize="false" [attr.data-jtk-show-progress]="showProgress">                
                <div class="jtk-gantt-progress-value">{{obj.progress}}</div>
                <div class="jtk-gantt-progress-gauge" style="width:{{obj.progress}}%"></div>
                <div class="jtk-gantt-delete" (click)="deleteMe()">×</div>
                <div class="jtk-gantt-connect" data-jtk-source="true">+</div>                
            </div>`
})
export class TaskComponent extends BaseGanttTaskComponent {

  showProgress = true

  constructor(service:GanttService) {
    super(service)
  }


  // deleteTask() {
  //   this.service.removeNode(this.getNode())
  // }

}
