Assert style conditional programming.
- Assert, if else and switch case in one.
- Be forced to handle all relevant logic branches on any condition check, unexpected read's throw automatically.
- Better than errors as values imo.

Example:
```
import { assert } from "./LogicalAssert.js"

function isAdmin(user) {
    let variable
    assert(user)({
        admin() { variable = true},
        user() { variable = false }
        //unhandled user value throws an assertion error implictly
    });
    return variable
//will never return undefined because
//alternative to not assigning a value is an assertion error 👍
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
```
