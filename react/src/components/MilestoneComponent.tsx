import {BAR_HEIGHT} from "../../../angular/src/constants"

export default function MilestoneComponent({ctx, removeTask}) {

    const { vertex, data } = ctx


    return <div className="jtk-gantt-task-group" data-jtk-target="true" style={{left:`${data.left}px`,width:`${data.size}px`, height:`${BAR_HEIGHT}px`,backgroundColor:data.color}} jtk-y-resize="false" jtk-x-resize="false" data-jtk-not-draggable="true">
            <div className="jtk-gantt-delete" onClick={() => removeTask(vertex.id)}>×</div>
        <div className="jtk-gantt-connect" data-jtk-source="true">+</div>
    </div>

}
