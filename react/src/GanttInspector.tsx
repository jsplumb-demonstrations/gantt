import {InspectorComponent} from "@jsplumbtoolkit/browser-ui-react"
import {Base, Node, Surface} from "@jsplumbtoolkit/browser-ui"
import {useContext, useState} from "react"
import {TYPE_TASK} from "./constants"
import {GanttContext} from "./GanttProvider"

export default function GanttInspector() {

    const {listen } = useContext(GanttContext)

    const [currentObj, setCurrentObj] = useState<Node>(null)
    const [currentType, setCurrentType] = useState('')

    const [progress,setProgress] = useState(0)

    const renderEmptyContainer = () => setCurrentType('')
    const refresh = (obj:Base) => {
        setCurrentType(obj.type)
        setCurrentObj(obj as Node)
        setProgress(obj.data.progress || 0)
    }

    function updateRangeLabel(e:Event) {
        setProgress((e as any).target.value)
    }

    function afterUpdate(surface:Surface) {
        surface.relayout()
    }

    return <InspectorComponent className="jtk-gantt-inspector"
                               refresh={refresh}
                               renderEmptyContainer={renderEmptyContainer}
                                showCloseButton={true}
                                afterUpdate={afterUpdate}>

        {currentType === TYPE_TASK && <div className="jtk-gantt-inspector jtk-task-inspector">
            <div>Name</div>
            <input type="text" jtk-att="name" jtk-focus="true"/>
            <div>Progress</div>
            <div style={{display:"flex",alignItems:"center"}}>
                <input type="range" jtk-att="progress" min="0" max="100" defaultValue={currentObj.data.progress} onInput={(e) => updateRangeLabel(e)}/>
                <div className="jtk-gantt-progress-value-label">{progress}</div>
            </div>
            </div>}

    </InspectorComponent>
}
