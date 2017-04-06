//TODO: add other federated login methods
//TODO: should we get rid of the pencil icon for editing tasks and make it so you just click on the task text and it turns into an editable text field?


var facebookProvider = new firebase.auth.FacebookAuthProvider(); //this is for Facebook account authorization
var googleProvider = new firebase.auth.GoogleAuthProvider(); //this is for Google account authorization
var currentlyVisibleWeekDates = new Array(7); //stores an array of the dates for the currently visible week
var dayDivArray = new Array(7); //dayDivArray[] will hold the 7 dayDiv objects. Each dayDiv is a div that houses the tasks for a given weekday. So there are 7 dayDivs corresponding to 7 days of the week.
var taskDivArray = new Array(7); //This will be an array of arrays that holds the task divs for each day of the currently visible week
var dayTaskJsonArray = new Array(7); //This will be an array of arrays that holds the Json data for the tasks of each day of the currently visible week

//Turns tasDivArray and dayTaskJsonArray into 2D arrays (each of their elements stores its own array)
for (var k=0; k<7; k++) {
    taskDivArray[k] = [];
    dayTaskJsonArray[k] = [];
}

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
        document.getElementById("sign_in_google_button").style.display = "none";
        document.getElementById("sign_out_button").style.display = "inline";
    } else {
        // No user is signed in.
        document.getElementById("sign_in_google_button").style.display = "inline";
        document.getElementById("sign_out_button").style.display = "none";
    }
});



/****************************************************/
/*********START DYNAMIC DIV GENERATION CODE**********/
/****************************************************/

//creates dayDiv elements and saves them in dayDivArray[]
for (var i=0; i<7; i++) {
    (function(i) {   //Solves closure problem described here: http://stackoverflow.com/questions/13343340/calling-an-asynchronous-function-within-a-for-loop-in-javascript.
        //Wrapping the contents of the FOR loop in this function allows us to get a reference to the current value of i, which we otherwise couldn't do from within the asynchronous addEventListener functions defined below

        var dayDiv = document.createElement("div");
        dayDiv.className = "day_div";
        var dayLabel = document.createElement("p");
        dayDiv.appendChild(dayLabel);
        var addTaskButton = document.createElement("button");
        addTaskButton.textContent = "Add task";
        dayDiv.appendChild(addTaskButton);

        addTaskButton.addEventListener("click", function() {
            addTaskButton.style.display = "none";  //Makes addTaskButton that was clicked disappear.
            var newTaskDiv = document.createElement("div"); //Creates a div to house the UI for adding a new task. This holds a textbox, Submit button, and Cancel button.
            dayDiv.appendChild(newTaskDiv);

            var newTaskInput = document.createElement("input");
            newTaskInput.type = "text";
            newTaskInput.placeholder = "task";
            newTaskDiv.appendChild(newTaskInput);

            var newTaskSaveButton = document.createElement("button");
            newTaskSaveButton.textContent = "Save task";
            newTaskDiv.appendChild(newTaskSaveButton);
            newTaskSaveButton.addEventListener("click", function() {
                var addedTaskDiv = document.createElement("div"); //Creates a <div> element to house a newly added task

                var markTaskFinishedImage = document.createElement("img");
                markTaskFinishedImage.src = "img/checkbox.png";
                addedTaskDiv.appendChild(markTaskFinishedImage);

                var addedTaskTextSpan = document.createElement("span");
                addedTaskTextSpan.textContent = newTaskInput.value; //Sets the textContent of the newly added task to be equal to what the user typed into the textbox
                addedTaskTextSpan.style.padding = "5px 10px 5px 10px";
                addedTaskDiv.appendChild(addedTaskTextSpan);

                var editTaskImage = document.createElement("img");
                editTaskImage.src = "img/edit_pencil.png";
                addedTaskDiv.appendChild(editTaskImage);

                dayDiv.insertBefore(addedTaskDiv, newTaskDiv);  //Inserts addedTask <p> element before the newTaskDiv <div> element. This ensures tasks are added to the page in the order the user enters them.

                writeUserData("Math", newTaskInput.value, i);
                newTaskInput.value = "";  //Removes existing text from newTaskInput textbox
            });

            var newTaskCancelButton = document.createElement("button");
            newTaskCancelButton.textContent = "Cancel";
            newTaskDiv.appendChild(newTaskCancelButton);
            newTaskCancelButton.addEventListener("click", function() {
                dayDiv.appendChild(addTaskButton);      //Moves addTaskButton back to the bottom of dayDiv
                addTaskButton.style.display = "block";  //Makes addTaskButton reappear
                newTaskDiv.style.display = "none";      //Makes newTaskDiv disappear
            });

        });  //end of addTaskButton.addEventListener anonymous function
        dayDivArray[i] = dayDiv;  //Sets the dayDiv we just built to be equal to the ith element of the dayDivArray[]
        document.body.appendChild(dayDivArray[i]);   //Makes the dayDiv appear on the page

    }(i)); //This is the end of the function that exists solely to solve closure problem. It's also where we pass in the value of i so that it's accessible within the above code.
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
        //TODO: remove existing taskDivArrays before reading
        readUserData();
    }

    setDaysOfWeek(currentlyVisibleWeekDates);
});

//handles the user pressing the "Next week" button
document.getElementById("next_week").addEventListener("click", function () {
    for (i=0; i<currentlyVisibleWeekDates.length; i++) {
        //add 7 days to each element of the currentlyVisibleWeekDates[] array
        currentlyVisibleWeekDates[i] = currentlyVisibleWeekDates[i].add(7).days();
        //TODO: remove existing taskDivArrays before reading
        readUserData();
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
function writeUserData(taskClass, taskText, dayIndex) {

    dayTaskJsonArray[dayIndex].push({
        taskClass: taskClass,
        taskText: taskText
    });

    var userId = firebase.auth().currentUser.uid;

    //write task data
    firebase.database().ref('users/' + userId + "/" + currentlyVisibleWeekDates[dayIndex].toString("dddd, MMMM dd, yyyy")).set(dayTaskJsonArray[dayIndex]);

}

//Reads data from Firebase. This only gets called at the initial page load or when the user switches between weeks.
function readUserData() {

    var userId = firebase.auth().currentUser.uid;
    for (var i=0; i<currentlyVisibleWeekDates.length; i++) {

        (function(i) {
            //the below code will execute every time the database entry at /users/userId changes

            firebase.database().ref('/users/' + userId + "/" + currentlyVisibleWeekDates[i].toString("dddd, MMMM dd, yyyy")).once('value', (function(snapshot) {
                    if (snapshot.val() !== null) {   // if there are no tasks for the day it'll return null and we move onto the next day

                        dayTaskJsonArray[i] = snapshot.val();

                        for (var j=0; j<dayTaskJsonArray[i].length; j++) {
                            var addedTaskDiv = document.createElement("div"); //Creates a <div> element to house a newly added task
                            addedTaskDiv.textContent = dayTaskJsonArray[i][j].taskText;  //Sets the textContent of the newly added task to be equal to what the user typed into the textbox
                            dayDivArray[i].insertBefore(addedTaskDiv, dayDivArray[i].childNodes[dayDivArray[i].childElementCount-1]);
                        }

                        //TODO: make edit and complete task buttons show up for entries being read
                        //TODO: store read tasks into the taskDivArray[] 2d array
                    }
                }
            ));

        }(i));
    }

}


document.getElementById("sign_in_google_button").addEventListener("click", function() {
    firebase.auth().signInWithPopup(googleProvider).then(function(result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
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


document.getElementById("sign_in_facebook_button").addEventListener("click", function() {
    firebase.auth().signInWithPopup(facebookProvider).then(function(result) {
        // This gives you a Facebook Access Token. You can use it to access the Facebook API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
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


document.getElementById("sign_out_button").addEventListener("click", function() {
    firebase.auth().signOut().then(function() {
    }).catch(function(error) {
        // An error happened.
        alert("Sign-out error occurred \n" + "Error code: " + errorCode + "\nError message: " + errorMessage);
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


/*****************************************/
/**********END FIREBASE CODE *************/
/*****************************************/
