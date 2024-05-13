export const DIALOG_NEW_TASK = "newTask"
export const DIALOG_NEW_TASK_GROUP = "newTaskGroup"
export const DIALOG_NEW_MILESTONE = "newMilestone"

export function _generateDialogTemplates() {
    return {
        [DIALOG_NEW_TASK]:{
            template:`<div class="jtk-gantt-dialog">
                                <span>Name:</span>
                                <input jtk-att="name" type="text" jtk-focus/>
                                <span>Group:</span>
                                <select jtk-att="parent">
                                    <option value="">No group</option>
                                    <r-each in="groups">
                                        <option value="{{id}}">{{name}}</option>
                                    </r-each>
                                </select>
                            </div>`,
            title:"New Task",
            cancelable:true
        },
        [DIALOG_NEW_TASK_GROUP]:{
            template:`<div class="jtk-gantt-dialog">
                                <span>Name:</span>
                                <input jtk-att="name" type="text" jtk-focus/>
                            </div>`,
            title:"New Task Group",
            cancelable:true
        },
        [DIALOG_NEW_MILESTONE]:{
            template:`<div class="jtk-gantt-dialog">
                                <span>Name:</span>
                                <input jtk-att="name" type="text" jtk-focus/>
                            </div>`,
            title:"New Milestone",
            cancelable:true
        }
    }
}
