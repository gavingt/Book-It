
// Initialize Firebase. This code should stay at the top of the <script> section
var config = {
    apiKey: "AIzaSyAEPEyYJBvmqqwu4XSFitMUENdskmKp0fc",
    authDomain: "classtask-162513.firebaseapp.com",
    databaseURL: "https://classtask-162513.firebaseio.com",
    storageBucket: "classtask-162513.appspot.com",
    messagingSenderId: "453189316211"
};
firebase.initializeApp(config);

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // User is signed in
        readUserData();
        document.getElementById("sign_in_button").style.display = "none";
        document.getElementById("sign_out_button").style.display = "inline";
    } else {
        // No user is signed in.
        document.getElementById("sign_in_button").style.display = "inline";
        document.getElementById("sign_out_button").style.display = "none";
    }
});

var nextTodoItemId = 10;  //this is a global variable for the item ID that will get assigned to new to-do items. This gets synced to Firebase inside the writeUserData() function
var provider = new firebase.auth.GoogleAuthProvider(); //this is for Google account authorization
var currentlyVisibleWeekDates; //stores an array of the dates for the currently visible week
var dayDivArray = new Array(7); //dayDivArray[] will hold the 7 dayDiv objects. Each dayDiv is a div that houses the tasks for a given weekday. So there are 7 dayDivs corresponding to 7 days of the week.



/****************************************************/
/*********START DYNAMIC DIV GENERATION CODE**********/
/****************************************************/

//creates dayDiv elements and saves them in dayDivArray[]
for (var i=0; i<7; i++) {
    (function () {   //wrapping the contents of the FOR loop in this function solves closure problem described here: http://stackoverflow.com/questions/19586137/addeventlistener-using-for-loop-and-passing-values

        var dayDiv = document.createElement("div");
        dayDiv.className = "day_div";
        var dayLabel = document.createElement("p");
        dayDiv.appendChild(dayLabel);
        var addTaskButton = document.createElement("button");
        addTaskButton.textContent = "Add task";
        dayDiv.appendChild(addTaskButton);

        addTaskButton.addEventListener("click", function() {
            addTaskButton.style.display = "none";  //make addTaskButton that was clicked disappear
            var newTaskDiv = document.createElement("div");
            dayDiv.appendChild(newTaskDiv);

            var newTaskInput = document.createElement("input");
            newTaskInput.type = "text";
            newTaskInput.placeholder = "task";
            newTaskDiv.appendChild(newTaskInput);

            var newTaskSaveButton = document.createElement("button");
            newTaskSaveButton.textContent = "Save task";
            newTaskDiv.appendChild(newTaskSaveButton);
            newTaskSaveButton.addEventListener("click", function() {
                var addedTask = document.createElement("p"); //Creates a <p> element to house a newly added task
                addedTask.textContent = newTaskInput.value;  //Sets the textContent of the newly added task to be equal to what the user typed into the textbox
                dayDiv.insertBefore(addedTask, newTaskDiv);  //Inserts addedTask <p> element before the newTaskDiv <div> element. This ensures tasks are added to the page in the order the user enters them.
                writeUserData("Math", newTaskInput.value, dayLabel.textContent);
                newTaskInput.value = "";  //Removes existing text from newTaskInput textbox
            });

            var newTaskCancelButton = document.createElement("button");
            newTaskCancelButton.textContent = "Cancel";
            newTaskDiv.appendChild(newTaskCancelButton);
            newTaskCancelButton.addEventListener("click", function() {
                addTaskButton.style.display = "block";  //Makes addTaskButton reappear
                newTaskDiv.style.display = "none";      //Makes newTaskDiv disappear
            });

        });  //end of addTaskButton.addEventListener anonymous function
        dayDivArray[i] = dayDiv;  //Sets the dayDiv we just built to be equal to the ith element of the dayDivArray[]
        document.body.appendChild(dayDivArray[i]);   //Makes the dayDiv appear on the page

    }()); //end of function that exists solely to solve closure problem
} //end of FOR loop


/****************************************************/
/**********END DYNAMIC DIV GENERATION CODE***********/
/****************************************************/


/*****************************************/
/*********START DATE HANDLING CODE********/
/*****************************************/


initializeDates();

//When user first loads the page, this sets the currentlyVisibleWeekDates[] array to the current week and then sets the dates to the page elements
function initializeDates() {

    currentlyVisibleWeekDates = [
        Date.parse("Monday"),
        Date.parse("Tuesday"),
        Date.parse("Wednesday"),
        Date.parse("Thursday"),
        Date.parse("Friday"),
        Date.parse("Saturday"),
        Date.parse("Sunday")
    ];

    setDaysOfWeek(currentlyVisibleWeekDates);
}

//sets the dates to the dayLabel elements in each dayDivArray[] element
function setDaysOfWeek() {
    for (i=0; i<dayDivArray.length; i++) {
        //Gets firstChild of each dayDivArray, which is the dayLabel element. Then it sets it to the current corresponding value in the dates[] array.
        dayDivArray[i].firstChild.textContent = currentlyVisibleWeekDates[i].toString("dddd, MMMM dd, yyyy");
    }
}

//handles the user pressing the "Previous week" button
document.getElementById("previous_week").addEventListener("click", function () {
    for (i=0; i<currentlyVisibleWeekDates.length; i++) {
        //subtract 7 days from each element of the currentlyVisibleWeekDates[] array
        currentlyVisibleWeekDates[i] = currentlyVisibleWeekDates[i].add(-7).days();
    }

    setDaysOfWeek(currentlyVisibleWeekDates);
});

//handles the user pressing the "Next week" button
document.getElementById("next_week").addEventListener("click", function () {
    for (i=0; i<currentlyVisibleWeekDates.length; i++) {
        //add 7 days to each element of the currentlyVisibleWeekDates[] array
        currentlyVisibleWeekDates[i] = currentlyVisibleWeekDates[i].add(7).days();
    }

    setDaysOfWeek(currentlyVisibleWeekDates);
});

/*****************************************/
/**********END DATE HANDLING CODE*********/
/*****************************************/




/*****************************************/
/**********START FIREBASE CODE ***********/
/*****************************************/

//write new task to database
function writeUserData(taskClass, taskText, taskDueDate) {


    var userId = firebase.auth().currentUser.uid;

    //write task data
    firebase.database().ref('users/' + userId + "/" + taskDueDate + "/" + nextTodoItemId).set({
        classChosen: taskClass,
        task: taskText
        //timeTaskAdded:  firebase.database.ServerValue.TIMESTAMP
    });

    // Increment nextTodoItemId by 1
    var nextTodoItemIdRef = firebase.database().ref('users/' + userId + "/nextTodoItemId");
    nextTodoItemIdRef.transaction(function(nextId) {
        if (nextId !== null) {
            nextTodoItemId = nextId + 1;
        }
        else {
            nextTodoItemId = 11;
        }
        return nextTodoItemId;
    });

}

function readUserData() {

    var userId = firebase.auth().currentUser.uid;
    // Gets the current value of nextTodoItemId from Firebase
    var nextTodoItemIdRef = firebase.database().ref('users/' + userId + "/nextTodoItemId");
    nextTodoItemIdRef.transaction(function(nextId) {
        if (nextId !== null) {
            nextTodoItemId = nextId;
        }
        else {
            nextTodoItemId = 10;
        }
        return nextTodoItemId;
    });


    for (var i=0; i<currentlyVisibleWeekDates.length; i++) {

        (function(i) { //This is an anonymous function that's here just to solve the problem of using an asynchronous function inside a FOR loop. We have to pass in i as an argument to this function or else the asynchronous Firebase function below won't keep track of the different values of i as we iterate through the FOR loop.
            //the below code will execute every time the database entry at /users/userId changes

            firebase.database().ref('/users/' + userId + "/" + currentlyVisibleWeekDates[i].toString("dddd, MMMM dd, yyyy")).once('value', (function(snapshot) {
                    if (snapshot.val() !== null) {   // if there are no tasks for the day it'll return null and we move onto the next day
                        var currentDayJson = snapshot.val();  //retrieves the JSON object containing all the current day's tasks from Firebase

                        for (individualTask in currentDayJson) {   // This is a FOR...IN loop. This turns each day's tasks (saved as objects) into an array currentDayJson[individualTask] .
                            var addedTask = document.createElement("p"); //Creates a <p> element to house a newly added task
                            addedTask.textContent = currentDayJson[individualTask].task;  //Sets the textContent of the newly added task to be equal to what the user typed into the textbox
                            //alert(addedTask.textContent);
                            dayDivArray[i].insertBefore(addedTask, dayDivArray[i].childNodes[dayDivArray[i].childElementCount-1]);
                        }

                        //TODO: should I use on or once?
                        //TODO: should I store each day's or class's tasks as arrays? Populate them at read and add to them at write
                        //TODO: problem with duplicate entries is that the above code executes every time a new task is added, so rather than just inserting the new task it inserts every task again

                    }
                }
            ));

        }(i));  // This is where we actually pass in the current value of i to the anonymous function. It's also where we end the anonymous function.
    }


}


document.getElementById("sign_in_button").addEventListener("click", function() {
    firebase.auth().signInWithPopup(provider).then(function(result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        // ...
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        alert("Sign-in error occurred: \n" + "Error code: " + errorCode + "\Error message: " + errorMessage);
    });
});

document.getElementById("profile_info_button").addEventListener("click", function() {
    var user = firebase.auth().currentUser;

    if (user !== null) {
        user.providerData.forEach(function (profile) {
            alert("Email: " + profile.email + "\nUID: " + user.uid);
        });
    }
    else {
        alert("Not signed in!");
    }
});

document.getElementById("sign_out_button").addEventListener("click", function() {
    firebase.auth().signOut().then(function() {
    }).catch(function(error) {
        // An error happened.
        alert("Sign-out error occurred \n" + "Error code: " + errorCode + "\nError message: " + errorMessage);
    });
});
/*****************************************/
/**********END FIREBASE CODE *************/
/*****************************************/
