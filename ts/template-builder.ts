import {BAR_HEIGHT} from "./constants";

/**
 * Create the template to use for tasks.
 * @param showProgress
 */
export function buildTaskTemplate(showProgress?:boolean) {
    showProgress = showProgress !== false
    return `<div class="jtk-gantt-task" data-jtk-target="true" style="left:{{left}}px;width:{{size}}px;height:${BAR_HEIGHT}px;background-color:{{color}}" jtk-y-resize="false" data-jtk-show-progress="${showProgress}">                
                <div class="jtk-gantt-progress-value">{{progress}}</div>
                <div class="jtk-gantt-progress-gauge" style="width:{{progress}}%"/>
                <div class="jtk-gantt-delete">×</div>
                <div class="jtk-gantt-connect" data-jtk-source="true">+</div>                
            </div>`
}

/**
 * Create the template to use for task groups.
 */
export function buildTaskGroupTemplate() {
    return `<div class="jtk-gantt-task-group" data-jtk-target="true" style="left:{{left}}px;width:{{size}}px;height:${BAR_HEIGHT}px;background-color:{{color}}" jtk-y-resize="false" jtk-x-resize="false" data-jtk-not-draggable="true">
                <div class="jtk-gantt-delete">×</div>
                <div class="jtk-gantt-connect" data-jtk-source="true">+</div>
            </div>`
}

/**
 * Create the template to use for milestones.
 */
export function buildMilestoneTemplate() {
    return `<div class="jtk-gantt-milestone" data-jtk-target="true" style="left:{{left}}px;width:{{size}}px;height:${BAR_HEIGHT}px;" jtk-y-resize="false" jtk-x-resize="false">
                <div class="jtk-gantt-milestone-body" style="background-color:{{color}}"/>
                <div class="jtk-gantt-delete">×</div>
                <div class="jtk-gantt-connect" data-jtk-source="true">+</div>
            </div>`
}
