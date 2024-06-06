import { BaseNodeComponent } from "@jsplumbtoolkit/browser-ui-angular"
import {Injectable, Input} from "@angular/core"
import {GanttService} from "./gantt.service"

@Injectable()
export abstract class BaseGanttTaskComponent extends BaseNodeComponent {

  @Input() chartId!:string

  constructor(protected service:GanttService) {
    super()
  }

  deleteMe() {
    this.service.removeItem(this.chartId, this.getNode().id)
  }

}
