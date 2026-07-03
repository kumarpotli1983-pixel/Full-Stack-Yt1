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
-----------------------------------------------------------
                User and video Models
-----------------------------------------------------------
* Used mongoose-aggregate-paginate-v2(package) -- it helps to render only 10 videos per page. 
-> if a DB has 10billion videos ; without paginate the server tries to download all videos but due to paginagte , we can restrict to certion number of videos.
-> it is called by using middleware "plugin"

* bcrypt - used to encrypt the password and decrypt it which tries to secure our password in form of strings.
->"bcrypt.hash(this.password,10)" - hashing means encrypting the password but can't be decrypted back. 
-> hashing is one way but bcrypt is two ways i.e both encrypting and decrypting
-> that 10 is "salt" which is used to increase the security and makes it slow.
is user1 password is "enosh" and user2 's password is also "enosh" then it gives error but due to salt to 10 , therefore user1->enosh , user2-enosh
->this is called by using a middleware "pre" i.e before only we are tring to encrypt before exporting

* jwt - json web token 
->Access token will be of short time , which makes our credentials , our data more secure . after Access token time it will log out automatically(Access_token_expires).
->Refresh_token is for more time , i.e may be days . insteasd of everytime asking the login credentails even after 1 day , the values stored in the server gives to browser wothout user manually entering . 

@ index - without it , searching a name out of million users will be difficulr and time consuming but instead index used as array which stores data may in sequentional order. eg: a:1-20, b:21-40 
@ trim - it will trim of the extra spaces before and after the word making two words same .eg: "  Hello World  " is same as "Hello World"

-----------------------------------------------------------
                Uplaoding file in the backend
-----------------------------------------------------------
* cloudinary a platform where we store our videos and images, it can compress and enlarge it . the uploaded data is converted to url and returns us the url which is stroed in the mongoDB.

* multer is a middleware , used to recive or send files from from frontend or server. 
-> express cannot decode the file that has been sen t to backend , so multer parses it and stores in the disk storage or memorystroage later from there it is uploaded to cloudinary then it is delected from the local storage.

express->multer->localstorage->cloudinary->url->mongoDB->delete from the localStorage.