import { assert } from "./LogicalAssert.js"

function isAdmin(user) {
    let variable
    assert(user)({
        admin() { variable = true},
        user() { variable = false }
        //unhandled user value throws an assertion error implictly
    });
    return variable // can not be undefined 👍
}

//admin must be admin assertion
assert(isAdmin('admin'))({
    true() { console.log('admin is admin') }
    //false would throw
})
//user must not be admin assertion
assert(isAdmin('user'))({
    false() { console.log('user not admin') }
    //true would throw
})
//undefined behaviour throws
try {
    assert(isAdmin('test'))({
        false() { console.log('test not admin') }
    })
} catch (_error) {
    console.log("expected")
}




// Simulate the postal service environment
const dummyPostalService = {
    actors: new Map([
        ['actor1', { postMessage: msg => console.log('Actor1 got:', msg) }],
        ['actor2', { postMessage: msg => console.log('Actor2 got:', msg) }]
    ]),
    systemFunctions: (_worker, msg) => console.log('System handled:', msg)
}

// Test messages
const testMessages = [
    {
        address: { to: 'actor1' },
        type: 'NORMAL',
        data: 'hello'
    },
    {
        address: { to: 'actor1' },
        type: 'CB_TEST',
        data: 'should be CB'
    },
    {
        address: { to: 'System' },
        type: 'SYSTEM',
        data: 'system call'
    },
    {
        address: { to: 'nonexistent' },
        type: 'NORMAL',
        data: 'should fail'
    }
]

// Test the logic
function testPostalLogic() {
    testMessages.forEach((message, i) => {
        console.log(`\nTest case ${i + 1}:`)
        try {
            assert(message.type.startsWith("CB"))({
                true() {
                    message.type = "CB"
                    console.log('Normalized CB type')
                },
                false() {
                    console.log(`Keeping original type: ${message.type}`)
                }
            })

            assert(message.address.to)({
                System() {
                    dummyPostalService.systemFunctions(null, message)
                },
                unknown() {
                    assert(dummyPostalService.actors.has(message.address.to))({
                        true() {
                            assert(dummyPostalService.actors.get(message.address.to) !== undefined)({
                                true() {
                                    const worker = dummyPostalService.actors.get(message.address.to)
                                    worker.postMessage(message)
                                },
                                false() { throw new Error(`No target worker found under ${message.address.to}`) }
                            })
                        },
                        false() {
                            console.log(`No actor found for: ${message.address.to}`)
                        }
                    })
                }
            })
        } catch (e) {
            console.log('Error:', e.message)
        }
    })
}

// Run tests
console.log('=== Testing Postal Service Logic ===')
testPostalLogic()

// Now all three should work:
assert("42")({
    "42"() { console.log('string "42" works') }
})

assert(42)({
    42() { console.log('number 42 works') }
})

assert(true)({
    true() { console.log('boolean true works') }
})


// Usage 
assert("hii")({
    true() { console.log('yes') },
    41() { console.log('almost') },
    "hii"() { console.log('hello') },
})

// Basic tests for assert function
console.log('\n=== Boolean Tests ===')
assert(true)({
    true() { console.log('✓ true works') }
})

assert(false)({
    false() { console.log('✓ false works') }
})

try {
    assert(true)({
        false() { }
    })
} catch (e) {
    console.log('✓ false boolean throws:', e.message)
}

console.log('\n=== Number Tests ===')
assert(42)({
    42() { console.log('✓ exact number works') }
})

assert(0)({
    0() { console.log('✓ zero works') }
})

assert(-1)({
    "-1"() { console.log('✓ negative number works') }
})

assert(3.14)({
    "3.14"() { console.log('✓ float works') }
})

console.log('\n=== String Tests ===')
assert('hello')({
    'hello'() { console.log('✓ string works') }
})

assert('')({
    ''() { console.log('✓ empty string works') }
})

// Tests for strict type/value equality
console.log('\n=== Strict Type Tests ===')

assert(true)({
    true() { console.log('✓ boolean true works') }
})

// String numbers
assert('0')({
    '0'() { console.log('✓ string "0" works') }
})

assert(0)({
    0() { console.log('✓ number 0 works') }
})

console.log('\n=== Null/Undefined Tests ===')
assert(null)({
    null() { console.log('✓ null works') }
})



console.log('\n=== Unknown Handler Tests ===')
assert('something')({
    'else'() { },
    unknown() { console.log('✓ unknown handler works') }
})

console.log('\n=== Multiple Cases Tests ===')
assert(42)({
    41() { console.log('wrong') },
    42() { console.log('✓ found correct among multiple') },
    43() { console.log('wrong') }
})

console.log('\n=== Error Cases Tests ===')
try {
    assert({})({
        42() { }
    })
} catch (e) {
    console.log('✓ object throws:', e.message)
}

try {
    assert(Symbol('test'))({
        'symbol'() { }
    })
} catch (e) {
    console.log('✓ symbol throws:', e.message)
}

try {
    assert(() => { })({
        'function'() { }
    })
} catch (e) {
    console.log('✓ function throws:', e.message)
}

console.log('\n=== Using as Assertion ===')
function dividePositive(a, b) {
    assert(b > 0)({
        true() { return a / b },
    })
}

try {
    console.log('✓ assertion passes:', dividePositive(10, 2))
} catch (e) {
    console.log('wrong - should not throw', e.message)
}

try {
    dividePositive(10, 0)
    console.log('wrong - should throw')
} catch (e) {
    console.log('✓ assertion fails correctly:', e.message)
}

// Type checking
function processUser(user) {
    assert(typeof user === 'object' && user !== null)({
        true() { console.log('✓ type assertion works') }
    })
}

try {
    processUser({ name: 'John' })
} catch (e) {
    console.log('wrong - should not throw', e.message)
}

try {
    processUser('not an object')
    console.log('wrong - should throw')
} catch (e) {
    console.log('✓ type assertion fails correctly:', e.message)
}

console.log('\n=== Complex Conditions ===')
const user = { age: 20, role: 'admin' }

assert(user.age >= 18 && user.role === 'admin')({
    true() { console.log('✓ complex condition works') }
})

// Array handling
assert([1, 2, 3].length)({
    3() { console.log('✓ array length check works') }
})

// Date comparison
const today = new Date()
assert(today instanceof Date)({
    true() { console.log('✓ instanceof check works') }
})

assert(undefined !== undefined)({
    false() { console.log('✓✓✓ undefined works') }
})