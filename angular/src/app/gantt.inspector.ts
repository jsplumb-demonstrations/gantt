import {AfterViewInit, Component, Input, OnInit} from "@angular/core"
import {Surface } from "@jsplumbtoolkit/browser-ui"
import {InspectorComponent} from "@jsplumbtoolkit/browser-ui-angular"

@Component({
  template: `<div class="inspector">
    
        @if(currentType === 'task') {
          <div class="jtk-gantt-inspector jtk-task-inspector">
            
              <div>Name</div>
              <input type="text" jtk-att="name" jtk-focus/>
              <div>Progress</div>
              <div style="display:flex;align-items:center">
                <input type="range" jtk-att="progress" min="0" max="100" value="{{currentObj.data.progress}}" (input)="updateRangeLabel($event)"/>
                <div class="jtk-gantt-progress-value-label">{{currentObj.data.progress}}</div>
              </div>
          </div>
        }

        @if(currentType === 'taskGroup') {
          <div class="jtk-gantt-inspector jtk-task-group-inspector">
            <div>Name</div>
            <input type="text" jtk-att="name" jtk-focus/>
          </div>
        }  

        @if(currentType === 'milestone') {
          <div class="jtk-gantt-inspector jtk-task-milestone-inspector">
            <div>Name</div>
            <input type="text" jtk-att="name" jtk-focus/>
          </div>
        }  
    
    </div>`,
  selector: 'jtk-gantt-inspector'
})
export class GanttInspector extends InspectorComponent implements OnInit {

  @Input() chartId!:string

  ngOnInit() {
    this.surfaceId = this.chartId
  }

  // updates the label next to the range slider for a task.
  updateRangeLabel(e:Event) {
    const el = e.target as HTMLInputElement
    const newValue = el.value
    el.nextElementSibling && (el.nextElementSibling.innerHTML = `${newValue}`)
  }

  /**
   * We relayout after an update because that causes the decoration to be repainted.
   */
  override afterUpdate(surface:Surface) {
    surface.relayout()
  }


}
