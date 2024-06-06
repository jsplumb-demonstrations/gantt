import {aFewDaysAgo, todayAsString, todayPlusAsString, datePlus} from "./util"

const base = aFewDaysAgo()

export function subtaskDataset() {
    return [{
        name: 'Planning',
        id: 'planning'
    }, {
        name: 'Requirements',
        id: 'requirements',
        parent: 'planning',
        start: base,
        end: datePlus(base,5)
    }, {
        name: 'Design',
        id: 'design',
        dependency: 'requirements',
        parent: 'planning'
    }, {
        name: 'Layout',
        id: 'layout',
        parent: 'design',
        start: datePlus(base, 3),
        end: datePlus(base,10),
        progress:75,
    }, {
        name: 'Graphics',
        id:"graphics",
        parent: 'design',
        dependency: 'layout',
        start: datePlus(base,8),
        end: datePlus(base,20)
    }, {
        name: 'Develop',
        id: 'develop',
        start: datePlus(base,5),
        end: datePlus(base,30)
    }, {
        name: 'Create unit tests',
        id: 'unit_tests',
        dependency: 'requirements',
        parent: 'develop',
        start: datePlus(base,5),
        end: datePlus(base,8)
    }, {
        name: 'Implement',
        id: 'implement',
        dependency: 'unit_tests',
        parent: 'develop',
        start: datePlus(base,8),
        end: datePlus(base,30)
    }]
}

export function simpleDataset() {
    return [{
        id: 's',
        name: 'Start prototype',
        start: todayAsString(),
        end: todayPlusAsString(2)
    }, {
        id: 'b',
        name: 'Develop',
        start: todayPlusAsString(2),
        end: todayPlusAsString(7),
        dependency: 's'
    }, {
        id: 'a',
        name: 'Run acceptance tests',
        start: todayPlusAsString(5),
        end: todayPlusAsString(8)
    }, {
        id:'prototype-milestone',
        name: 'Prototype finished',
        start: todayPlusAsString(9),
        dependency: ['a', 'b'],
        milestone: true
    }]
}
