import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, Input} from "@angular/core"
import {Base, Inspector } from "@jsplumbtoolkit/browser-ui"
import {jsPlumbService} from "@jsplumbtoolkit/browser-ui-angular"


@Component({
  template: `<div class="inspector">
        
        <div *ngIf="currentType === ''"></div>
    
        <div *ngIf="currentType === 'task'" class="jtk-gantt-inspector jtk-task-inspector">
          
            <div>Name</div>
            <input type="text" jtk-att="name" jtk-focus/>
            <div>Progress</div>
            <div style="display:flex;align-items:center">
              <input type="range" jtk-att="progress" min="0" max="100" value="{{obj.data.progress}}"/>
              <div class="jtk-gantt-progress-value-label">{{obj.data.progress}}</div>
            </div>
        </div>

        <div *ngIf="currentType === 'taskGroup'" class="jtk-gantt-inspector jtk-task-group-inspector">
          <div>Name</div>
          <input type="text" jtk-att="name" jtk-focus/>
        </div>

        <div *ngIf="currentType === 'milestone'" class="jtk-gantt-inspector jtk-task-milestone-inspector">
          <div>Name</div>
          <input type="text" jtk-att="name" jtk-focus/>
        </div>
    
    </div>`,
  selector: 'jtk-gantt-inspector'
})
export class GanttInspector implements AfterViewInit {

  @Input() chartId!:string
  inspector!: Inspector
  $jsplumb = inject(jsPlumbService)
  currentType = ''
  obj!:Base

  constructor(private el: ElementRef, private changeDetector: ChangeDetectorRef) { }

  ngAfterViewInit(): void {

    this.$jsplumb.getSurface(this.chartId, (surface) => {
      this.inspector = new Inspector({
        container: this.el.nativeElement,
        surface,
        renderEmptyContainer: () => {
          this.currentType = '';
          this.changeDetector.detectChanges()
        },
        refresh: (obj: Base, cb: () => void) => {
          this.obj = obj
          this.currentType = obj.data.type;
          setTimeout(cb, 0);
          this.changeDetector.detectChanges();
        },
        afterUpdate:() => surface.relayout()
      });

      // JsPlumb's inspectors don't natively support the range element currently, so we listen for change events
      // and invoke an update manually. From 6.24.0 onwards this will not be necessary.
      surface.on(this.el.nativeElement, "change", "[type='range']", (e:MouseEvent) => {
        const newValue = (e.target as any).value
        this.inspector.setValue("progress", newValue)
      })

      /**
       * Update the label next to the slider to show the current percentage as the slider is dragged.
       */
      surface.on(this.el.nativeElement, "input", "[type='range']", (e:MouseEvent) => {
        const t = e.target as HTMLInputElement
        const newValue = t.value
        t.nextElementSibling && (t.nextElementSibling.innerHTML = `${newValue}`)
      })

    });
  }


}
