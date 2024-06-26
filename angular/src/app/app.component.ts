import {AfterViewInit, Component, ViewChild} from '@angular/core'

import {GanttComponent} from "./gantt.component"
import {GanttOptions} from "../defs"
import {subtaskDataset} from "../data-generator"

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'angular';

  toolkitId = "gantt-example"

  @ViewChild(GanttComponent) gantt!:GanttComponent


  ganttOptions:GanttOptions = {
    // timeline:{
    //   showDayNumber:false
    // }
  }

  ngAfterViewInit(): void {
    this.gantt.load(subtaskDataset())
  }

}
