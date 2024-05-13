import {ONE_DAY_IN_MILLISECONDS} from "./constants"

export const NARROW_DAY_FORMAT = new Intl.DateTimeFormat("default", { weekday: "narrow" })
export const SHORT_DAY_FORMAT = new Intl.DateTimeFormat("default", { weekday: "short" })
export const MONTH_FORMAT = new Intl.DateTimeFormat("default", { month: "short" })

/**
 * Returns the milliseconds value corresponding to the beginning of today's date (12am).
 */
export function today():number {
    const d2 = new Date()
    d2.setUTCHours(0)
    d2.setUTCMinutes(0)
    d2.setUTCSeconds(0)
    d2.setUTCMilliseconds(0)
    return d2.getTime()
}

export function aFewDaysAgo():number {
    return today() - (3 * ONE_DAY_IN_MILLISECONDS)
}

export function todayAsString() {
    return serializeDate(new Date(today()))
}

export function todayPlus(days:number) {
    const d = today(), d2 = new Date(d + (days * ONE_DAY_IN_MILLISECONDS))
    return d2
}

export function todayPlusAsString(days:number):string {
    return serializeDate(new Date(todayPlus(days)))
}

export function datePlus(date:number, days:number) {
    return date + (days * ONE_DAY_IN_MILLISECONDS)
}

/**
 * returns the first week of the year in which the given date falls, according to ISO 8601. Also gives you
 * the start date for that week which may of course be in the previous year.
 * @param dateInMillis
 */
export function getWeekOfYear(dateInMillis:number) {
    const date = new Date(dateInMillis)

    // ISO week date weeks start on Monday, so correct the day number
    const nDay = (date.getDay() + 6) % 7;

    // ISO 8601 states that week 1 is the week with the first Thursday of that year
    // Set the target date to the Thursday in the target week
    date.setDate(date.getDate() - nDay + 3);

    // Store the millisecond value of the target date
    const n1stThursday = date.valueOf();

    // Set the target to the first Thursday of the year
    // First, set the target to January 1st
    date.setMonth(0, 1);

    // Not a Thursday? Correct the date to the next Thursday
    if (date.getDay() !== 4) {
        date.setMonth(0, 1 + ((4 - date.getDay()) + 7) % 7);
    }

    const startOfFirstWeek = new Date(date.getTime() - (3 * ONE_DAY_IN_MILLISECONDS))

    // The week number is the number of weeks between the first Thursday of the year
    // and the Thursday in the target week (604800000 = 7 * 24 * 3600 * 1000)
    const weekOfYear = 1 + Math.ceil((n1stThursday - date.getTime()) / 604800000)
    const startOfThisWeek = n1stThursday - (3 * ONE_DAY_IN_MILLISECONDS)
    return [ weekOfYear, startOfThisWeek, startOfFirstWeek.getTime()]
}

const dateRe=/([0-9]{4,4})([0-9]{2,2})([0-9]{2,2})/

export function parseDate(date:string|number):number {

    if (typeof date === 'string') {

        const parts = date.match(dateRe),
            y = parseInt(parts[1], 10),
            mo = parseInt(parts[2], 10),
            day = parseInt(parts[3], 10)

        const d = new Date()
        d.setMilliseconds(0)
        d.setFullYear(y)
        d.setMonth(mo - 1)
        d.setDate(day)
        d.setHours(0)
        d.setMinutes(0)
        d.setSeconds(0)
        return d.getTime()
    } else {
        return date
    }
}

export function padNumber(n:number):string {
    return (n < 10 ? "0" : "" ) + n
}


/**
 * Serialize the given date into yyyyMMdd format.
 * @param d
 */
export function serializeDate(d:Date):string {
    return `${d.getFullYear()}${padNumber(d.getMonth() + 1)}${padNumber(d.getDate())}`
}

/**
 * Definition of an object that can hand out colors to use.
 */
export interface ColorGenerator {
    generate():string
}

/**
 * A random color generator, random within bounds, it won't return a color with any component outside the range (20, 245)
 */
export class RandomColorGenerator implements ColorGenerator {
    generate():string {
        return `rgb(${Math.floor((Math.random() * 225) + 20)}, ${Math.floor((Math.random() * 225) + 20)}, ${Math.floor((Math.random() * 225) + 20)})`
    }
}

export class StaticColorGenerator implements ColorGenerator {
    colors
    counter = 0
    constructor(...colors:Array<string>) {
        this.colors = colors
    }

    generate() {
        const c = this.colors[this.counter]
        this.counter++
        if (this.counter >= this.colors.length) {
            this.counter = 0
        }
        return c
    }
}
