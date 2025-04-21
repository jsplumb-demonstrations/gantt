import {BAR_HEIGHT} from "../../../angular/src/constants"

export default function TaskComponent({ctx, showProgress,  removeTask}) {

    const { vertex, data } = ctx


    return <div className="jtk-gantt-task" data-jtk-target="true" style={{left:`${data.left}px`,width:`${data.size}px`, height:`${BAR_HEIGHT}px`, backgroundColor:`${data.color}`}} jtk-y-resize="false" data-jtk-show-progress={showProgress}>
                <div className="jtk-gantt-progress-value">{data.progress}</div>
                <div className="jtk-gantt-progress-gauge" style={{width:`${data.progress}%`}}/>
                <div className="jtk-gantt-delete" onClick={() => removeTask(vertex.id)}>×</div>
                <div className="jtk-gantt-connect" data-jtk-source="true">+</div>
            </div>

}
