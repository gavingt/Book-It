
//TODO: move tasks from past days into "past due" section
//TODO: progress spinner for fetching data?
//TODO: separate sections in each dayDiv for different classes
//TODO: make an "undated tasks" section
//TODO: When I make Past due section, I have to parse the dates as they're stored back into moment() objects. Do this using: console.log(moment(currentlyVisibleWeekDates[1], "dddd, MMMM D, YYYY"));



var facebookProvider = new firebase.auth.FacebookAuthProvider(); //this is for Facebook account authorization
var googleProvider = new firebase.auth.GoogleAuthProvider(); //this is for Google account authorization
var currentlyVisibleWeekDates = new Array(7); //stores an array of the dates for the currently visible week
var dayDivArray = new Array(7); //dayDivArray[] will hold the 7 dayDiv objects. Each dayDiv is a div that houses the tasks for a given weekday. So there are 7 dayDivs corresponding to 7 days of the week.
var addedTaskDivArray = new Array(7); //This will be an array of arrays that holds the addedTaskDiv objects for each day of the currently visible week
var dayTaskJsonArray = new Array(7); //This will be an array of arrays that holds the JSON data for the tasks of each day of the currently visible week
var snackbarTimeoutId;  //stores the timeout ID associated with the timeout function used for the snackbar
var snackbar = document.getElementById("snackbar"); //gets a reference to the snackbar div
var todaysDateIndex; //Stores a number from 0-6, corresponding to the 7 days Sunday through Saturday, indicating which day of the week is today. For instance, if today is Sunday it equals 0, and if it's Tuesday it equals 2.
var currentlyVisibleWeekIndex = 0; //this tracks which week is currently being viewed. It starts at 0 and increments if user hits Next week button, and decrements when user hits Previous week button
var initialReadComplete = false; //boolean value that stores whether or not we've done the initial reading of data at page load (or at login, if not logged in already at page load)


// Initialize Firebase. This code should stay at the top of main.js
var config = {
    apiKey: "AIzaSyAEPEyYJBvmqqwu4XSFitMUENdskmKp0fc",
    authDomain: "classtask-162513.firebaseapp.com",
    databaseURL: "https://classtask-162513.firebaseio.com",
    storageBucket: "classtask-162513.appspot.com",
    messagingSenderId: "453189316211"
};
firebase.initializeApp(config);

//The below two lines force checkbox.png to be preloaded so that it doesn't load after the tasks themselves arrive from Firebase
var image = new Image();
image.src = "img/checkbox.png";

initialize2dArrays(); //calls initialize2dArrays() function when user first loads page
createDayDivs();  //creates a dayDiv for each day when user first loads page
initializeDates(); //gets the dates for the current week when user first loads page
hideOrShowDayDivs();


firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // User is signed in
        if (initialReadComplete === false) {  //Doing this check ensures that Firebase's hourly token refreshes don't cause re-reading of data (and thus duplicate tasks, since readUserData() generates addedTaskDiv elements).
            readUserData(); //as soon as user is signed in, read existing data from Firebase and populate addedTaskDivs with tasks
            initialReadComplete = true;
        }
        document.getElementById("sign_in_google_button").style.display = "none";
        document.getElementById("sign_in_facebook_button").style.display = "none";
        document.getElementById("sign_out_button").style.display = "inline";
    } else {
        // No user is signed in.
        document.getElementById("sign_in_google_button").style.display = "inline";
        document.getElementById("sign_in_facebook_button").style.display = "inline";
        document.getElementById("sign_out_button").style.display = "none";
    }
});


/****************************************************/
/************START DOM MANIPULATION CODE*************/
/****************************************************/


//creates dayDiv elements and saves them in dayDivArray[]
function createDayDivs () {
    for (var i = 0; i < 7; i++) {
        (function (i) {   //Solves closure problem described here: http://stackoverflow.com/questions/13343340/calling-an-asynchronous-function-within-a-for-loop-in-javascript.
            //Wrapping the contents of the FOR loop in this function allows us to get a reference to the current value of i, which we otherwise couldn't do from within the asynchronous addEventListener functions defined below

            var dayDiv = document.createElement("div");
            dayDiv.className = "day_div"; //Gives every dayDiv a class name so they can be referenced later in the JavaScript code
            var dayLabel = document.createElement("span");
            dayDiv.appendChild(dayLabel);
            var addTaskButton = document.createElement("button");
            addTaskButton.className = "add_task_button"; //Gives every addTaskButton a class name so they can be referenced later in the JavaScript code
            addTaskButton.style.display = "block";
            addTaskButton.textContent = "Add task";
            dayDiv.appendChild(addTaskButton);

            addTaskButton.addEventListener("click", function () {

                resetDomElements();
                addTaskButton.style.display = "none";  //Makes addTaskButton that was clicked disappear.
                var newTaskDiv = document.createElement("div"); //Creates a div to house the UI for adding a new task. This holds a textbox, Submit button, and Cancel button.
                newTaskDiv.className = "new_task_div";  //Gives every newTaskDiv a class name so they can be referenced later in the JavaScript code
                dayDiv.appendChild(newTaskDiv);

                var newTaskInput = document.createElement("input");
                newTaskInput.type = "text";
                newTaskInput.placeholder = "task";
                newTaskInput.addEventListener("keyup", function (event) {  //this eventListener simulates pressing the newTaskSaveButton after you type into newTaskInput and press Enter.
                    event.preventDefault();
                    if (event.keyCode === 13) {
                        newTaskSaveButton.click();
                    }
                });
                newTaskDiv.appendChild(newTaskInput);
                newTaskInput.focus();

                var newTaskSaveButton = document.createElement("button");
                newTaskSaveButton.textContent = "Add task";
                newTaskDiv.appendChild(newTaskSaveButton);
                newTaskSaveButton.addEventListener("click", function () {
                    if (newTaskInput.value !== "") {  //don't save task if text field is left blank
                        var addedTaskDiv = createAddedTaskDiv(newTaskInput.value, i, addTaskButton); //call function createAddedTaskDiv and pass in the necessary values to create a new addedTaskDiv, then return the new object and save it as a var.
                        dayDiv.insertBefore(addedTaskDiv, newTaskDiv);  //Inserts addedTask <p> element before the newTaskDiv <div> element. This ensures tasks are added to the page in the order the user enters them.
                        writeUserData("Math", newTaskInput.value, i);
                        newTaskInput.value = "";  //Removes existing text from newTaskInput textbox
                    }
                });

                var newTaskCancelButton = document.createElement("button");
                newTaskCancelButton.textContent = "Cancel";
                newTaskDiv.appendChild(newTaskCancelButton);
                newTaskCancelButton.addEventListener("click", function () {
                    dayDiv.appendChild(addTaskButton);      //Moves addTaskButton back to the bottom of dayDiv
                    addTaskButton.style.display = "block";  //Makes addTaskButton reappear
                    newTaskDiv.parentNode.removeChild(newTaskDiv); //Removes newTaskDiv from the DOM

                });
            });
            dayDivArray[i] = dayDiv;  //Sets the dayDiv we just built to be equal to the ith element of the dayDivArray[]
            document.body.appendChild(dayDivArray[i]);   //Makes the dayDiv appear on the page

        }(i)); //This is the end of the function that exists solely to solve closure problem. It's also where we pass in the value of i so that it's accessible within the above code.
    } //end of FOR loop
}


//Creates addedTaskDiv elements. This function gets called in two places:
                                                         // 1) in createDayDivs(), to generate an addedTaskDiv when the user adds a new task
                                                         // 2) in readUserData(), to generate addedTaskDivs from existing tasks stored in Firebase
function createAddedTaskDiv(addedTaskText, dayIndex, addTaskButton) {

    var addedTaskDiv = document.createElement("div"); //creates a <div> element to house a newly added task
    addedTaskDiv.className = "added_task_div";

    var markTaskFinishedImage = document.createElement("img");
    markTaskFinishedImage.src = "img/checkbox.png";
    markTaskFinishedImage.addEventListener("click", function() {
        addedTaskDiv.style.display = "none";
        addedTaskDiv.className = ""; //We hide this particular addedTaskDiv from the resetDomElements() function by removing its className, since otherwise it could get brought back if user clicks addTaskButton within 10 seconds

        var completedTaskIndex = addedTaskDivArray[dayIndex].indexOf(markTaskFinishedImage.parentNode);
        var completedTaskJson = dayTaskJsonArray[dayIndex][completedTaskIndex];
        addedTaskDivArray[dayIndex].splice(completedTaskIndex, 1);
        removeUserData(dayIndex, completedTaskIndex);


        //We have to clone the snackbar to remove its event listeners so that the UNDO button doesn't undo multiple completed tasks
        var newSnackbar = snackbar.cloneNode(true);
        snackbar.parentNode.replaceChild(newSnackbar, snackbar);
        snackbar = newSnackbar;
        snackbar.style.visibility = "visible";
        clearTimeout(snackbarTimeoutId);

        snackbarTimeoutId = setTimeout(function(){ snackbar.style.visibility = "hidden"; }, 10500); //hides snackbar after waiting 500 ms for fadeout animation to run

        document.getElementById("snackbar_undo_button").addEventListener("click", function() {

            snackbar.style.visibility = "hidden";
            undoRemoveUserData(completedTaskJson, completedTaskIndex, dayIndex);
            addedTaskDiv.style.display = "block";
            addedTaskDiv.className = "added_task_div";  //We unhide this addedTaskDiv from the resetDomElements() function.
            addedTaskDivArray[dayIndex].splice(completedTaskIndex, 0, addedTaskDiv);
        });

        document.getElementById("snackbar_hide_button").addEventListener("click", function() {
            snackbar.style.visibility = "hidden";
        });

    });
    addedTaskDiv.appendChild(markTaskFinishedImage);

    var addedTaskTextSpan = document.createElement("span");
    addedTaskTextSpan.textContent = addedTaskText; //Sets the textContent of the newly added task to be equal to what the user typed into the textbox
    addedTaskTextSpan.style.padding = "5px 10px 5px 10px";
    addedTaskDiv.appendChild(addedTaskTextSpan);

    var addedTaskDivIndex = addedTaskDivArray[dayIndex].push(addedTaskDiv) - 1; //push returns new length of the array, so we subtract 1 to get the index of the new addedTaskDiv

    //task editing is handled in the eventListener below
    addedTaskTextSpan.addEventListener("click", function() {

        resetDomElements ();

        addedTaskDiv.style.display = "none";
        addTaskButton.style.display = "none";

        var editTaskDiv = document.createElement("div"); //Creates a div to house the UI for editing a task. This holds a textbox, Save button, and Cancel button.
        editTaskDiv.className = "edit_task_div";  //Gives every editTaskDiv a class name so they can be referenced later in the JavaScript code

        var editTaskInput = document.createElement("input");
        editTaskInput.type = "text";
        editTaskInput.placeholder = "task";
        editTaskInput.value = addedTaskTextSpan.textContent; //sets text of the editTaskInput to be equal to the added text of the addedTaskTextSpan that was clicked on
        editTaskInput.addEventListener("keyup", function (event) {  //this eventListener simulates pressing the editTaskSaveButton after you type into editTaskInput and press Enter.
            event.preventDefault();
            if (event.keyCode === 13) {
                editTaskSaveButton.click();
            }
        });
        editTaskDiv.appendChild(editTaskInput);

        var editTaskSaveButton = document.createElement("button");
        editTaskSaveButton.textContent = "Save";
        editTaskDiv.appendChild(editTaskSaveButton);
        editTaskSaveButton.addEventListener("click", function () {

            addedTaskTextSpan.textContent = editTaskInput.value; //set the addedTaskTextSpan's text equal to the newly edited text value from newTaskInput
            addedTaskDiv.style.display = "block"; //make the addedTaskDiv visible again after we hid it earlier
            editTaskDiv.parentNode.removeChild(editTaskDiv); //Removes editTaskDiv from the DOM
            addTaskButton.style.display = "block";

            editUserData("math", addedTaskTextSpan.textContent, dayIndex, addedTaskDivIndex);

        });

        var editTaskCancelButton = document.createElement("button");
        editTaskCancelButton.textContent = "Cancel";
        editTaskDiv.appendChild(editTaskCancelButton);
        editTaskCancelButton.addEventListener("click", function () {
            dayDivArray[dayIndex].appendChild(addTaskButton);      //Moves addTaskButton back to the bottom of dayDiv
            addTaskButton.style.display = "block";  //Makes addTaskButton reappear
            addedTaskDiv.style.display = "block";
            editTaskDiv.parentNode.removeChild(editTaskDiv);  //Removes editTaskDiv from the DOM
        });

        dayDivArray[dayIndex].insertBefore(editTaskDiv, addedTaskDiv);
        editTaskInput.focus();

    });

    return addedTaskDiv;
}

//Hides or shows dayDivs based on the week that's visible. If it's the current week, we hide the dayDivs for days that have already passed.
function hideOrShowDayDivs () {

        for(var i=0; i<todaysDateIndex; i++) {
            dayDivArray[i].style.display = "none";
        }
}




//Turns taskDivArray and dayTaskJsonArray into 2D arrays (each of their elements stores its own array)
function initialize2dArrays() {
    for (var k = 0; k < 7; k++) {
        addedTaskDivArray[k] = [];
        dayTaskJsonArray[k] = [];
    }
}

//Resets various DOM elements to their original states.
function resetDomElements() {

    var addedTaskDivsToShow = document.getElementsByClassName("added_task_div");
    for (var i = 0; i < addedTaskDivsToShow.length; i++) {
        addedTaskDivsToShow[i].parentNode.appendChild(addedTaskDivsToShow[i]);
        addedTaskDivsToShow[i].style.display = "block";
    }

    var newTaskDivsToHide = document.getElementsByClassName("new_task_div");
    for (var j = 0; j < newTaskDivsToHide.length; j++) {
        newTaskDivsToHide[j].parentNode.removeChild(newTaskDivsToHide[j]);
    }

    var editTaskDivsToHide = document.getElementsByClassName("edit_task_div");
    for (var k = 0; k < editTaskDivsToHide.length; k++) {
        editTaskDivsToHide[k].parentNode.removeChild(editTaskDivsToHide[k]);
    }

    var addTaskButtonsToShow = document.getElementsByClassName("add_task_button");
    for (var m = 0; m < addTaskButtonsToShow.length; m++) {
        dayDivArray[m].appendChild(addTaskButtonsToShow[m]);
        addTaskButtonsToShow[m].style.display = "block";
    }

}


/****************************************************/
/*************END DOM MANIPULATION CODE**************/
/****************************************************/




/****************************************************/
/**************START DATE HANDLING CODE**************/
/****************************************************/


//When user first loads the page, this sets the currentlyVisibleWeekDates[] array to the current week and then sets the dates to the page elements
function initializeDates() {

    for (var i=0; i<7; i++) {
        currentlyVisibleWeekDates[i] = moment().startOf('isoWeek').add(i, 'days').format("dddd, MMMM D, YYYY");
    }

    todaysDateIndex = moment().isoWeekday() - 1;  //Stores a number 0-6 indicating the current day of the week from Monday to Sunday. For instance, Monday = 0 and Thursday = 3.

    setDaysOfWeek(currentlyVisibleWeekDates);
}


//sets the dates to the dayLabel elements in each dayDivArray[] element
function setDaysOfWeek() {
    for (var i=0; i<dayDivArray.length; i++) {
        //Gets firstChild of each dayDivArray, which is the dayLabel element. Then it sets it to the current corresponding value in the dates[] array.
        dayDivArray[i].firstChild.textContent = currentlyVisibleWeekDates[i];
    }
}

//handles the user pressing the "Previous week" button
document.getElementById("previous_week_button").addEventListener("click", function () {

    currentlyVisibleWeekIndex--; //decrement currentlyVisibleWeekIndex
    if (currentlyVisibleWeekIndex === 0) {
        document.getElementById("previous_week_button").disabled = true;  //If user is viewing the current week, disable Previous week button.
    }
    snackbar.style.visibility = "hidden";

    for (var i=0; i<currentlyVisibleWeekDates.length; i++) {
        //subtract 7 days from each element of the currentlyVisibleWeekDates[] array
        currentlyVisibleWeekDates[i] = currentlyVisibleWeekDates[i].add(-7, 'days');

        initialize2dArrays(); //clear 2d arrays before populating them with elements from the new week
        var nodesToRemove = document.querySelectorAll(".added_task_div"); //find all addedTaskDiv elements and save them in nodesToRemove[] array
        for (var j=0; j<nodesToRemove.length; j++) {   //iterate through nodesToRemove[] array and remove each element
            nodesToRemove[j].parentNode.removeChild(nodesToRemove[j]);
        }
    }

    readUserData();  //read user data for new week
    setDaysOfWeek(currentlyVisibleWeekDates);
    resetDomElements();
});

//handles the user pressing the "Next week" button
document.getElementById("next_week_button").addEventListener("click", function () {

    currentlyVisibleWeekIndex++; //increment currentlyVisibleWeekIndex
    document.getElementById("previous_week_button").disabled = false;

    snackbar.style.visibility = "hidden";

    for (var i=0; i<currentlyVisibleWeekDates.length; i++) {
        //add 7 days to each element of the currentlyVisibleWeekDates[] array
        currentlyVisibleWeekDates[i] = currentlyVisibleWeekDates[i].add(7, 'days');

        initialize2dArrays(); //clear 2d arrays before populating them with elements from the new week
        var nodesToRemove = document.querySelectorAll(".added_task_div"); //find all addedTaskDiv elements and save them in nodesToRemove[] array
        for (var j=0; j<nodesToRemove.length; j++) {    //iterate through nodesToRemove[] array and remove each element
            nodesToRemove[j].parentNode.removeChild(nodesToRemove[j]);
        }

    }
    readUserData();  //read user data for new week
    setDaysOfWeek(currentlyVisibleWeekDates);
    resetDomElements();
});


/****************************************************/
/***************END DATE HANDLING CODE***************/
/****************************************************/




/****************************************************/
/*****************START FIREBASE CODE ***************/
/****************************************************/


//edit existing task in database
function editUserData(taskClass, taskText, dayIndex, taskIndex) {

    dayTaskJsonArray[dayIndex][taskIndex] = {
        taskClass: taskClass,
        taskText: taskText
    };

    var userId = firebase.auth().currentUser.uid;

    //write edited task data
    firebase.database().ref('users/' + userId + "/" + currentlyVisibleWeekDates[dayIndex] + "/" + taskIndex).set(dayTaskJsonArray[dayIndex][taskIndex]);

}


//remove existing task in database
function removeUserData(dayIndex, taskIndex) {

    dayTaskJsonArray[dayIndex].splice(taskIndex,1);

    var userId = firebase.auth().currentUser.uid;

    //saves a given day's tasks with the completed task removed
    firebase.database().ref('users/' + userId + "/" + currentlyVisibleWeekDates[dayIndex]).set(dayTaskJsonArray[dayIndex]);

}


//write a task back into the database if it was marked complete and then the UNDO button in snackbar was pressed
function undoRemoveUserData(completedTaskJson, taskIndex, dayIndex) {

    dayTaskJsonArray[dayIndex].splice(taskIndex, 0, completedTaskJson);

    var userId = firebase.auth().currentUser.uid;

    //write new task data
    firebase.database().ref('users/' + userId + "/" + currentlyVisibleWeekDates[dayIndex]).set(dayTaskJsonArray[dayIndex]);
}


//write new task to database
function writeUserData(taskClass, taskText, dayIndex) {

    dayTaskJsonArray[dayIndex].push({
        taskClass: taskClass,
        taskText: taskText
    });

    var userId = firebase.auth().currentUser.uid;

    //write new task data
    firebase.database().ref('users/' + userId + "/" + currentlyVisibleWeekDates[dayIndex]).set(dayTaskJsonArray[dayIndex]);
}


//Reads data from Firebase. This only gets called at the initial page load or when the user switches between weeks.
function readUserData() {

    var userId = firebase.auth().currentUser.uid;
    for (var i=0; i<currentlyVisibleWeekDates.length; i++) {

        (function(i) {
            firebase.database().ref('/users/' + userId + "/" + currentlyVisibleWeekDates[i]).once('value', (function(snapshot) {
                    if (snapshot.val() !== null) {   // if there are no tasks for the day it'll return null and we move onto the next day

                        dayTaskJsonArray[i] = snapshot.val();
                        for (var j=0; j<dayTaskJsonArray[i].length; j++) {
                            var addedTaskDiv = createAddedTaskDiv(dayTaskJsonArray[i][j].taskText, i, dayDivArray[i].lastElementChild); //call function createAddedTaskDiv and pass in the necessary values to create a new addedTaskDiv, then return the new object and save it as a var.
                            dayDivArray[i].insertBefore(addedTaskDiv, dayDivArray[i].childNodes[dayDivArray[i].childElementCount-1]); //Inserts addedTaskDiv <div> element before the newTaskDiv <div> element (which is the last child element in dayDivArray[i] ). This ensures tasks are added to the page in the order the user enters them.
                        }
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


/******************************************************/
/*****************END FIREBASE CODE********************/
/******************************************************/
