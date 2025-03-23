import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core'
import { BrowserModule } from '@angular/platform-browser';
import { jsPlumbToolkitModule } from "@jsplumbtoolkit/browser-ui-angular"

import { AppComponent } from './app.component';
import {TaskComponent} from "./task.component"
import {TaskGroupComponent} from "./task.group.component"
import {MilestoneComponent} from "./milestone.component"
import {GanttComponent} from "./gantt.component"
import {GanttService} from "./gantt.service"
import {GanttControlsComponent} from "./gantt.controls.component"
import {GanttInspector} from "./gantt.inspector"

@NgModule({
  declarations: [
    AppComponent, TaskComponent, TaskGroupComponent, MilestoneComponent, GanttComponent, GanttControlsComponent, GanttInspector
  ],
  imports: [
    BrowserModule, jsPlumbToolkitModule
  ],
  providers: [GanttService],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
