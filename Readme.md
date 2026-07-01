# backend listening frm chai aur code yt channel
---------------------------------------------------------
              chai aur backend - Connect DataBase in MERN 
---------------------------------------------------------
**Two important points about database connectivity**: 

1. When connecting to databases, handling potential data-not-found scenarios is essential. Employ try/catch blocks or promises to manage errors or we can also use promises.

key to remember : ( wrap in try-catch )

2. Database operations involve latency, and traditional synchronous code can lead to blocking, where the program waits for the database query to complete before moving on. So, we should async/await which allows for non-blocking execution, enabling the program to continue with other tasks while waiting for the database response. 

key to remember :  ( always remember the database is in another continent, so use async await)
-------------------------------------------------------
 **Exit code assignment**

1. using exit() method of process object:
    usecase: It is used if you want to terminate the execution completely regardless of any async operation an all.
    default value exit(0)  which indicate exit successfully without any interption.
    any non zero value  like exit(1) indicates process exit intentionaly.

code :   
 function hello() {
    process.exit(1);
    console.log('hello');
}
hello();

in this  code process will terminate without logging hello in the console.

2. using exitCode property  of process:
    usecase: It is used if you want to terminate the execution completely but allowing to completion of the pending tasks.
    default value exitCode=0  which indicate exit successfully without any interption.
    any non zero value  like exitCode=1 indicates process exit intentionaly.

code: 
function hello() {
    process.exitCode = 1;
    console.log('hello');
}
hello();

in this code process will exit but after logging hello in the console.
--------------------------------------------------------
Tips: 
    - Read the errors before referring to any material for resolving.
    - write error statements in a clear manner, debuggging mei help karegi.
    - env file mei change karte hi, server ko restart karna hi padega, no other option, nodemon env files ka track nahi rakhta.
-----------------------------------------------------------
            API
-----------------------------------------------------------
Q.Why is asyncHandler needed?

A.In Express.js, if an asynchronous function throws an error, you need to explicitly pass that error to the next function for the Express error-handling middleware to catch it. Without this, your server might crash or not handle the error properly.

* CLASS apiError extend ERROR means, apiError inherits the properties of ERror and with additional 

* super() -- it is the constructor of the Error class
without it calling it shows error in ApiError

* instead of everytime res.status(300).json({name,age}),
using ApiError or ApiResponse follows structed format for every case i.e rs.status(200).json(
    new ApiError(200,"something Gone Wrong!",user)
)