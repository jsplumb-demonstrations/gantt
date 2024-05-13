import {
    ready,
    BrowserElement
} from "@jsplumbtoolkit/browser-ui"

import {simpleDataset, subtaskDataset} from "./data-generator";

import {Gantt} from "./gantt";
import {GanttInspector} from "./gantt-inspector"
import {StaticColorGenerator} from "./util"


ready(() => {


    const ganttContainer = document.querySelector("#jtk-demo-gantt") as BrowserElement
    ganttContainer.classList.add("jtk-gantt")

    const dataset = subtaskDataset()
    // const dataset = simpleDataset()

    const gantt = new Gantt({
        timeline:{
            showQuarters:false
        },
        colorGenerator:new StaticColorGenerator("cadetblue")
    })

    gantt.render(ganttContainer)

    gantt.load(dataset)

    document.getElementById("btnHome").addEventListener("click", (e:MouseEvent) => {
        gantt.zoomToFit()
    })

    document.getElementById("btnNewTask").addEventListener("click", (e:MouseEvent) => {
        gantt.addNewTask()
    })

    document.getElementById("btnNewTaskGroup").addEventListener("click", (e:MouseEvent) => {
        gantt.addNewTaskGroup()
    })

    document.getElementById("btnNewMilestone").addEventListener("click", (e:MouseEvent) => {
        gantt.addNewMilestone()
    })

    document.getElementById("btnExport").addEventListener("click", (e:MouseEvent) => {
        const output = gantt.export()
        console.log(JSON.stringify(output))
    })


    ;(window as any).gantt = gantt;

    new GanttInspector({
        surface:gantt.surface,
        container:document.getElementById("inspector"),
        afterUpdate:() => gantt.surface.relayout()
    })




})
