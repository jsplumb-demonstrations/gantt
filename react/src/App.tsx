
import GanttChart from "./GanttChart"
import GanttControls from "./GanttControls"
import GanttInspector from "./GanttInspector"
import {GanttProvider} from "./GanttProvider"
import {SurfaceProvider} from "@jsplumbtoolkit/browser-ui-react"


function App() {

  const ganttOptions = {
    // ...
  }

  return (<div id="jtk-demo-gantt">
      <SurfaceProvider>
        <GanttProvider>
          <GanttControls chartId="gantt-example"/>
          <GanttChart options="ganttOptions" chartId="gantt-example"/>
          <GanttInspector chartId="gantt-example"/>
        </GanttProvider>
      </SurfaceProvider>
  </div>)
}

export default App
