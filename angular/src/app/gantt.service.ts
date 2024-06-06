import {Dialogs, uuid } from "@jsplumbtoolkit/browser-ui"
import {jsPlumbService} from "@jsplumbtoolkit/browser-ui-angular"
import {Injectable} from "@angular/core"
import {ParsedTask} from "../defs"
import {_generateDialogTemplates, DIALOG_NEW_MILESTONE, DIALOG_NEW_TASK, DIALOG_NEW_TASK_GROUP} from "../dialogs"
import {today, todayPlus} from "../util"
import {TYPE_MILESTONE, TYPE_TASK, TYPE_TASK_GROUP} from "../constants"
import {GanttComponent} from "./gantt.component"

@Injectable({providedIn: 'root'})
export class GanttService {

  charts:Record<string, GanttComponent> = {}

  dialogs!:Dialogs

  constructor($jsplumb:jsPlumbService) {

    this.dialogs = new Dialogs({
      dialogs:_generateDialogTemplates()
    })

  }

  register(chartId:string, gantt:GanttComponent) {
    this.charts[chartId] = gantt
  }

  addNewTask(chartId:string) {
    this._addNew(chartId, TYPE_TASK, DIALOG_NEW_TASK)
  }

  addNewTaskGroup(chartId:string) {
    this._addNew(chartId, TYPE_TASK_GROUP, DIALOG_NEW_TASK_GROUP)
  }

  addNewMilestone(chartId:string) {
    this._addNew(chartId, TYPE_MILESTONE, DIALOG_NEW_MILESTONE)
  }

  removeItem(chartId:string, groupId:string) {
    const gantt = this.charts[chartId]
    if(gantt) {
      gantt.removeTask(groupId)
    }
  }

  private _addNew(chartId:string, type:string, dialogId:string) {

    const gantt = this.charts[chartId]

    if(gantt) {

      this.dialogs.show({
        id: dialogId,
        onOK: (data: Record<string, any>) => {

          if (data['parent'] != null && (data['parent'].length === 0)) {
            delete data['parent']
          }

          data['start'] = today()
          data['end'] = todayPlus(1)
          data['subtasks'] = []
          data['id'] = uuid()
          data['color'] = gantt.assignColor()
          data['height'] = gantt.barHeight
          data['type'] = type
          data['progress'] = 0
          data['top'] = 0

          gantt.addTask(data as ParsedTask)

          gantt._relayoutTasks()
          gantt.surface.relayout()
        },
        data: {groups: gantt.toolkit.getNodes().filter(n => n.data['type'] === TYPE_TASK_GROUP).map(n => n.data)}
      })
    }
  }

  exportToConsole(chartId:string) {
    const gantt = this.charts[chartId]

    if(gantt) {
      return gantt.exportToConsole()
    }
  }

  resetView(chartId:string) {
    this.charts[chartId].zoomToFit()
  }

}
