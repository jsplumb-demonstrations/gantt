import {Gantt} from "./defs"
import {useContext} from "react"
import {GanttContext} from "./GanttProvider"
import {addNewMilestone, addNewTask, addNewTaskGroup} from "./util"

export default function GanttControls() {

    let {listen} = useContext(GanttContext)

    function resetView() {
        listen((g:Gantt) => {
            g.zoomToFit()
        })
    }

    function addTask() {
        listen((g:Gantt) => {
            addNewTask(g)
        })
    }

    function addTaskGroup() {
        listen((g:Gantt) => {
            addNewTaskGroup(g)
        })
    }

    function addMilestone() {
        listen((g:Gantt) => {
            addNewMilestone(g)
        })
    }

    function exportToConsole() {
        listen((g:Gantt) => {
            g.exportToConsole()
        })
    }

    return <div className="jtk-gantt-controls">
        <button onClick={() => resetView()}>HOME</button>
    <button onClick={() => addTask()}>NEW TASK</button>
    <button onClick={() => addTaskGroup()}>NEW TASK GROUP</button>
    <button onClick={() => addMilestone()}>NEW MILESTONE</button>
    <button onClick={() => exportToConsole()}>EXPORT TO CONSOLE</button>
    </div>
}
