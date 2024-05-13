/**
 * Inspector for tasks and task groups. We extend `VanillaInspector` here and provide a resolver to get an appropriate
 * template based on whether the inspector is editing a task or a group.
 */
import {Base, BrowserElement, Surface, VanillaInspector, VanillaInspectorOptions} from "@jsplumbtoolkit/browser-ui"
import {TYPE_MILESTONE, TYPE_TASK, TYPE_TASK_GROUP} from "./constants"

const inspectorTemplates = {
    [TYPE_TASK] : `
            <div class="jtk-gantt-inspector jtk-task-inspector">                
                    <div>Name</div>
                    <input type="text" jtk-att="name" jtk-focus/>
                    <div>Progress</div>
                    <div style="display:flex;align-items:center">            
                        <input type="range" jtk-att="progress" min="0" max="100" value="{{progress}}"/>
                        <div class="jtk-gantt-progress-value-label">{{progress}}</div>
                    </div>                              
            </div>`,
    [TYPE_TASK_GROUP] : `
            <div class="jtk-gantt-inspector jtk-task-group-inspector">
                <div>Name</div>
                <input type="text" jtk-att="name" jtk-focus/>
            </div>`,
    [TYPE_MILESTONE] : `
            <div class="jtk-gantt-inspector jtk-task-milestone-inspector">
                <div>Name</div>
                <input type="text" jtk-att="name" jtk-focus/>
            </div>`
}

export interface GanttInspectorOptions {
    surface:Surface
    container:BrowserElement
    afterUpdate?:() => any
}

export class GanttInspector extends VanillaInspector {

    constructor(options:GanttInspectorOptions) {
        super(Object.assign(options, {
            templateResolver:(obj:Base) => {
                return inspectorTemplates[obj.type]
            }
        }) as VanillaInspectorOptions)

        // JsPlumb's inspectors don't natively support the range element currently, so we listen for change events
        // and invoke an update manually. From 6.24.0 onwards this will not be necessary.
        options.surface.on(options.container, "change", "[type='range']", (e:MouseEvent) => {
            const newValue = (e.target as any).value
            this.setValue("progress", newValue)
        })

        /**
         * Update the label next to the slider to show the current percentage as the slider is dragged.
         */
        options.surface.on(options.container, "input", "[type='range']", (e:MouseEvent) => {
            const t = e.target as HTMLInputElement
            const newValue = t.value
            t.nextElementSibling.innerHTML = `${newValue}`
        })

    }
}
