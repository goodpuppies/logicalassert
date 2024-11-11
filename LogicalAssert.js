import nodeAssert from "node:assert";

export function assert(value) {
    return function (handlers) {
        const callSite = new Error().stack.split('\n')[2]

        for (const key of Object.keys(handlers)) {
            if (key === 'unknown') continue

            if (typeof value === 'number' && !isNaN(key)) {
                if (Number(key) === value) {
                    return handlers[key]()
                }
            } else if (typeof value === 'boolean' && ['true', 'false'].includes(key)) {
                if (value === (key === 'true')) {
                    return handlers[key]()
                }
            } else if (value === null && key === 'null') {
                return handlers[key]()
            } else if (value === key) {
                return handlers[key]()
            }
        }
        if ('unknown' in handlers) {
            return handlers.unknown()
        }

        const validValues = Object.keys(handlers)
            .filter(k => k !== 'unknown')
            .join(', ')

        nodeAssert(false,
            `\nAssertion failed for value: ${value}\n` +
            `Valid values: ${validValues}\n` +
            `Got: ${typeof value}\n` +
            `At: ${callSite}`
        )
    }
}