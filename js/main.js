
//TODO: progress spinner for fetching data?
//TODO: When I make Past due section, I have to parse the dates as they're stored back into moment() objects. Do this using: console.log(moment(currentlyActiveWeekDates[1], "dddd, MMMM D, YYYY"));
//TODO: Look into local storage

//TODO: use <hr> elements between tasks?
//TODO: Remove all addedTaskDivs before calling readTaskData(). Then we can use .on instead of .once and token refreshes won't cause duplicate entries. Also, remove bbInitialReadComplete variable.
//TODO: add shadows to each dayDiv

//TODO: hide all content until user has completed initial setup wizard.
//TODO: if settingsList isn't visible, settingsButton should be gray (trying to fix mobile issue with settings button)

//TODO: if task text is too long, it should wrap within dayDivs.
//TODO: when user switches weeks, hide content until it's reloaded.


var facebookProvider = new firebase.auth.FacebookAuthProvider(); //this is for Facebook account authorization
var googleProvider = new firebase.auth.GoogleAuthProvider(); //this is for Google account authorization
var currentlyActiveWeekDates = new Array(7); //stores an array of the dates for the currently visible week
var dayDivArray = new Array(7); //dayDivArray[] will hold the 7 dayDiv objects. Each dayDiv is a div that houses the tasks for a given weekday. So there are 7 dayDivs corresponding to 7 days of the week.
var addedTaskDivArray = new Array(7); //This will be an array of arrays that holds the addedTaskDiv objects for each day of the currently visible week
var dayTaskJsonArray = new Array(7); //This will be an array of arrays that holds the JSON data for the tasks of each day of the currently visible week
var classDivArray = []; //This will be an array of arrays that stores the classDivs inside each dayDiv.
var classJsonArray = []; //Stores the JSON data for each class the user added in the initial setup wizard.
var snackbarTimeoutId;  //Stores the timeout ID associated with the timeout function used for the snackbar.
var snackbar = document.getElementById("snackbar"); //gets a reference to the snackbar div
var todaysDateIndex; //Stores a number from 0-6, corresponding to the 7 days Sunday through Saturday, indicating which day of the week is today. For instance, if today is Sunday it equals 0, and if it's Tuesday it equals 2.
var currentlyActiveWeekIndex = 0; //this tracks which week is currently being viewed. It starts at 0 and increments if user hits Next week button, and decrements when user hits Previous week button
var bInitialReadComplete = false; //boolean value that stores whether or not we've done the initial reading of data at page load (or at login, if not logged in already at page load)


// Initialize Firebase. This code should stay at the top of main.js
var config = {
    apiKey: "AIzaSyAEPEyYJBvmqqwu4XSFitMUENdskmKp0fc",
    authDomain: "classtask-162513.firebaseapp.com",
    databaseURL: "https://classtask-162513.firebaseio.com",
    storageBucket: "classtask-162513.appspot.com",
    messagingSenderId: "453189316211"
};
firebase.initializeApp(config);

//The below lines force these images to be preloaded so that they they're ready when we need to display them.
var image1 = new Image();
image1.src = "img/checkbox.png";

var image2 = new Image();
image2.src = "img/settings_black.png";

initialize2dArrays(true); //calls initialize2dArrays() function when user first loads page

//Only show greeting if screen is big enough to accommodate it. We check both width and height because we have to account for both portrait and landscape mode.
if (screen.width > 750 && screen.height > 750) {
    document.getElementById('greeting').style.display = "inline";
}


//Perform certain actions based on whether Firebase reports that a user is signed in or not signed in.
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // User is signed in
        if (bInitialReadComplete === false) {  //Doing this check ensures that Firebase's hourly token refreshes don't cause re-reading of data (and thus duplicate tasks, since readTaskData() generates addedTaskDiv elements).

            createDayDivs();  //creates a dayDiv for each day when user first loads page
            initializeDates(); //gets the dates for the current week when user first loads page
            readClassData(); //Reads class data if it exists for current user. If it doesn't, opens initial setup wizard.
            readTaskData(); //as soon as user is signed in, read existing data from Firebase and populate addedTaskDivs with tasks
            bInitialReadComplete = true;
            document.getElementById('sign_in_button_group').style.display = "none";

            initializeSettingsButton(true);

        }

    } else {
        // No user is signed in.
        document.getElementById("sign_in_button_group").style.display = "inline-block";
        initializeSettingsButton(false);

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
            dayDiv.style.display = "none";

            var dayDivHeader = document.createElement("div");
            dayDivHeader.className = "day_div_header";
            dayDiv.appendChild(dayDivHeader);

            dayDivArray[i] = dayDiv;  //Sets the dayDiv we just built to be equal to the ith element of the dayDivArray[]
            document.body.appendChild(dayDivArray[i]);   //Makes the dayDiv appear on the page

        }(i)); //This is the end of the function that exists solely to solve closure problem. It's also where we pass in the value of i so that it's accessible within the above code.
    } //end of FOR loop
}




//Creates classDiv elements. This function gets called in readTaskData(), to generate classDivs based on the classes the user added in the initial setup wizard.
function createClassDiv(classColor, classDays, classLocation, className, classTime, dayIndex, classDivIndex) {
    var classDiv = document.createElement("div");
    classDiv.className = "class_div";
    classDiv.style.backgroundColor = classColor;

    var classNameDiv = document.createElement("div");
    classNameDiv.className = "class_name_div";
    classNameDiv.textContent = className;
    classDiv.appendChild(classNameDiv);


    var addTaskButton = document.createElement("button");
    addTaskButton.className = "add_task_button"; //Gives every addTaskButton a class name so they can be referenced later in the JavaScript code
    addTaskButton.style.display = "block";
    addTaskButton.textContent = "Add task";
    classDiv.appendChild(addTaskButton);

    addTaskButton.addEventListener("click", function () {

        resetDomElements();
        addTaskButton.style.display = "none";  //Makes addTaskButton that was clicked disappear.
        var newTaskDiv = document.createElement("div"); //Creates a div to house the UI for adding a new task. This holds a textbox, Submit button, and Cancel button.
        newTaskDiv.className = "new_task_div";  //Gives every newTaskDiv a class name so they can be referenced later in the JavaScript code
        classDiv.appendChild(newTaskDiv);

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
                var addedTaskDiv = createAddedTaskDiv(newTaskInput.value, dayIndex, classDivIndex); //call function createAddedTaskDiv and pass in the necessary values to create a new addedTaskDiv, then return the new object and save it as a var.
                classDiv.insertBefore(addedTaskDiv, newTaskDiv);  //Inserts addedTaskDiv before the newTaskDiv. This ensures tasks are added to the page in the order the user enters them.

                writeUserData(classDivIndex, newTaskInput.value, dayIndex);

                newTaskInput.value = "";  //Removes existing text from newTaskInput textbox
            }
        });

        var newTaskCancelButton = document.createElement("button");
        newTaskCancelButton.textContent = "Cancel";
        newTaskDiv.appendChild(newTaskCancelButton);
        newTaskCancelButton.addEventListener("click", function () {
            classDiv.appendChild(addTaskButton);      //Moves addTaskButton back to the bottom of dayDiv
            addTaskButton.style.display = "block";  //Makes addTaskButton reappear
            newTaskDiv.parentNode.removeChild(newTaskDiv); //Removes newTaskDiv from the DOM

        });
    });


    classDivArray[dayIndex].push(classDiv);
    return classDiv;
}





//Creates addedTaskDiv elements. This function gets called in two places:
                                                         // 1) in createDayDivs(), to generate an addedTaskDiv when the user adds a new task
                                                         // 2) in readTaskData(), to generate addedTaskDivs from existing tasks stored in Firebase
function createAddedTaskDiv(addedTaskText, dayIndex, classDivIndex) {

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
        removeTaskData(dayIndex, completedTaskIndex);


        //We have to clone the snackbar to remove its event listeners so that the UNDO button doesn't undo multiple completed tasks
        var newSnackbar = snackbar.cloneNode(true);
        snackbar.parentNode.replaceChild(newSnackbar, snackbar);
        snackbar = newSnackbar;
        snackbar.style.visibility = "visible";
        clearTimeout(snackbarTimeoutId);

        snackbarTimeoutId = setTimeout(function(){ snackbar.style.visibility = "hidden"; }, 10000); //hides snackbar after waiting 500 ms for fadeout animation to run

        document.getElementById("snackbar_undo_button").addEventListener("click", function() {

            snackbar.style.visibility = "hidden";
            undoRemoveTaskData(completedTaskJson, completedTaskIndex, dayIndex);
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

        resetDomElements();

        addedTaskDiv.style.display = "none";
        //classDivArray[dayIndex][classDivIndex].lastElementChild.style.display = "none";  //hide addTaskButton

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
            //classDivArray[dayIndex][classDivIndex].lastElementChild.style.display = "block";  //show addTaskButton

            editTaskData(classDivIndex, addedTaskTextSpan.textContent, dayIndex, addedTaskDivIndex);

        });

        var editTaskCancelButton = document.createElement("button");
        editTaskCancelButton.textContent = "Cancel";
        editTaskDiv.appendChild(editTaskCancelButton);
        editTaskCancelButton.addEventListener("click", function () {
            //classDivArray[dayIndex][classDivIndex].lastElementChild.style.display = "block";  //Makes addTaskButton reappear
            addedTaskDiv.style.display = "block";
            editTaskDiv.parentNode.removeChild(editTaskDiv);  //Removes editTaskDiv from the DOM
        });

        //dayDivArray[dayIndex].insertBefore(editTaskDiv, addedTaskDiv);
        classDivArray[dayIndex][classDivIndex].insertBefore(editTaskDiv, addedTaskDiv);
        editTaskInput.focus();

    });

    return addedTaskDiv;
}



//Hides or shows dayDivs based on the week that's visible. If it's the current week, we hide the dayDivs for days that have already passed.
function hideOrShowDayDivs () {

    document.getElementById("week_switcher_buttons").style.display = "block";

    for (var i=0; i<dayDivArray.length; i++) {
        dayDivArray[i].style.display = "block";
    }

    if (currentlyActiveWeekIndex === 0) {
        for (var j = 0; j<todaysDateIndex; j++) {
            dayDivArray[j].style.display = "none";
        }
    }
    else {
        for (var k = 0; k<todaysDateIndex; k++) {
            dayDivArray[k].style.display = "block";
        }
    }
}




//Turns taskDivArray, dayTaskJsonArray, and classDivArray into 2D arrays (each of their elements stores its own array)
function initialize2dArrays(bIncludeClassDivArray) {
    for (var i = 0; i < 7; i++) {
        addedTaskDivArray[i] = [];
        dayTaskJsonArray[i] = [];
        if (bIncludeClassDivArray) {
            classDivArray[i] = [];
        }
    }
}



//Resets various DOM elements to their original states.
function resetDomElements() {

    var addedTaskDivsToShow = document.getElementsByClassName("added_task_div");
    for (var i = 0; i < addedTaskDivsToShow.length; i++) {

        //addedTaskDivsToShow[i].parentNode.appendChild(addedTaskDivsToShow[i]);
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

    var addTaskButtonsToShow = document.getElementsByClassName("add_task_button"); //store all addTaskButton in a local array
    var classDivs = document.getElementsByClassName("class_div"); //store all classDivs in a local array
    for (var m=0; m<classDivs.length; m++) {
        classDivs[m].appendChild(addTaskButtonsToShow[m]);
        addTaskButtonsToShow[m].style.display = "block";
    }

}


/****************************************************/
/*************END DOM MANIPULATION CODE**************/
/****************************************************/




/****************************************************/
/**************START DATE HANDLING CODE**************/
/****************************************************/


//When user first loads the page, this sets the currentlyActiveWeekDates[] array to the current week and then sets the dates to the page elements
function initializeDates() {

    for (var i=0; i<7; i++) {
        currentlyActiveWeekDates[i] = moment().startOf('isoWeek').add(i, 'days').format("dddd, MMMM D, YYYY");
    }

    todaysDateIndex = moment().isoWeekday() - 1;  //Stores  a number 0-6 indicating the current day of the week from Monday to Sunday. For instance, Monday = 0 and Thursday = 3.

    setDaysOfWeek(currentlyActiveWeekDates);
}


//sets the dates to the dateLabel elements in each dayDivArray[] element
function setDaysOfWeek() {
    for (var i=0; i<dayDivArray.length; i++) {

        if (currentlyActiveWeekDates[i] === moment().format("dddd, MMMM D, YYYY")) {
            dayDivArray[i].firstChild.textContent = currentlyActiveWeekDates[i] + " (Today)";  //if currentlyActiveWeekDates[i] is storing today's date, append " (Today)" at the end.
        }
        else if (currentlyActiveWeekDates[i] === moment().add(1, 'days').format("dddd, MMMM D, YYYY")) {
            dayDivArray[i].firstChild.textContent = currentlyActiveWeekDates[i] + " (Tomorrow)";  //if currentlyActiveWeekDates[i] is storing tomorrow's date, append " (Tomorrow)" at the end.
        }
        else {
            dayDivArray[i].firstChild.textContent = currentlyActiveWeekDates[i]; //Get firstChild of each dayDivArray, which is the dateLabel element. Then we set its textContent equal to the corresponding entry in the currentlyActiveWeekDates[] array.
        }
    }
}

//handles the user pressing the "Previous week" button
document.getElementById("previous_week_button").addEventListener("click", function () {

    currentlyActiveWeekIndex--; //decrement currentlyActiveWeekIndex
    if (currentlyActiveWeekIndex === 0) {
        document.getElementById("previous_week_button").disabled = true;  //If user is viewing the current week, disable Previous week button.
    }
    snackbar.style.visibility = "hidden";

    for (var i=0; i<currentlyActiveWeekDates.length; i++) {
        //subtract 7 days from each element of the currentlyActiveWeekDates[] array
        currentlyActiveWeekDates[i] = moment(currentlyActiveWeekDates[i], "dddd, MMMM D, YYYY").add(-7, 'days').format("dddd, MMMM D, YYYY");

        initialize2dArrays(false); //clear 2d arrays before populating them with elements from the new week
        var nodesToRemove = document.querySelectorAll(".added_task_div"); //find all addedTaskDiv elements and save them in nodesToRemove[] array
        for (var j=0; j<nodesToRemove.length; j++) {   //iterate through nodesToRemove[] array and remove each element
            nodesToRemove[j].parentNode.removeChild(nodesToRemove[j]);
        }
    }

    readTaskData();  //read user data for new week
    setDaysOfWeek(currentlyActiveWeekDates);
    resetDomElements();
    hideOrShowDayDivs();
});

//handles the user pressing the "Next week" button
document.getElementById("next_week_button").addEventListener("click", function () {

    currentlyActiveWeekIndex++; //increment currentlyActiveWeekIndex
    document.getElementById("previous_week_button").disabled = false;

    snackbar.style.visibility = "hidden";

    for (var i=0; i<currentlyActiveWeekDates.length; i++) {
        //add 7 days to each element of the currentlyActiveWeekDates[] array
        currentlyActiveWeekDates[i] = moment(currentlyActiveWeekDates[i], "dddd, MMMM D, YYYY").add(7, 'days').format("dddd, MMMM D, YYYY");

        initialize2dArrays(false); //clear 2d arrays before populating them with elements from the new week
        var nodesToRemove = document.querySelectorAll(".added_task_div"); //find all addedTaskDiv elements and save them in nodesToRemove[] array
        for (var j=0; j<nodesToRemove.length; j++) {    //iterate through nodesToRemove[] array and remove each element
            nodesToRemove[j].parentNode.removeChild(nodesToRemove[j]);
        }

    }
    readTaskData();  //read user data for new week
    setDaysOfWeek(currentlyActiveWeekDates);
    resetDomElements();
    hideOrShowDayDivs();
});


/****************************************************/
/***************END DATE HANDLING CODE***************/
/****************************************************/




/****************************************************/
/*****************START FIREBASE CODE ***************/
/****************************************************/





//edit existing task in database
function editTaskData(taskClassIndex, taskText, dayIndex, taskIndex) {

    dayTaskJsonArray[dayIndex][taskIndex] = {
        taskClassIndex: taskClassIndex,
        taskText: taskText
    };

    var userId = firebase.auth().currentUser.uid;

    //write edited task data
    firebase.database().ref('users/' + userId + "/" + currentlyActiveWeekDates[dayIndex] + "/" + taskIndex).set(dayTaskJsonArray[dayIndex][taskIndex]);

}


//remove existing task in database
function removeTaskData(dayIndex, taskIndex) {

    dayTaskJsonArray[dayIndex].splice(taskIndex,1);

    var userId = firebase.auth().currentUser.uid;

    //saves a given day's tasks with the completed task removed
    firebase.database().ref('users/' + userId + "/" + currentlyActiveWeekDates[dayIndex]).set(dayTaskJsonArray[dayIndex]);

}


//write a task back into the database if it was marked complete and then the UNDO button in snackbar was pressed
function undoRemoveTaskData(completedTaskJson, taskIndex, dayIndex) {

    dayTaskJsonArray[dayIndex].splice(taskIndex, 0, completedTaskJson);

    var userId = firebase.auth().currentUser.uid;

    //write new task data
    firebase.database().ref('users/' + userId + "/" + currentlyActiveWeekDates[dayIndex]).set(dayTaskJsonArray[dayIndex]);
}


//write new task to database
function writeUserData(taskClassIndex, taskText, dayIndex) {

    dayTaskJsonArray[dayIndex].push({
        taskClassIndex: taskClassIndex,
        taskText: taskText
    });

    var userId = firebase.auth().currentUser.uid;

    //write new task data
    firebase.database().ref('users/' + userId + "/" + currentlyActiveWeekDates[dayIndex]).set(dayTaskJsonArray[dayIndex]);
}


//Reads class data if it exists. If it doesn't, it opens the initial setup wizard.
function readClassData() {

    var userId = firebase.auth().currentUser.uid;

    for (var i = 0; i < dayDivArray.length; i++) {

        (function (i) {

            //Fetch class data
            firebase.database().ref('/users/' + userId + "/classes").once('value', (function (snapshot) {
                    if (snapshot.val() !== null) {   // if there are no tasks for the day it'll return null and we move onto the next day
                        classJsonArray = snapshot.val(); //Store entire "classes" JSON object from Firebase as classJsonArray.
                        for (var j = 0; j < classJsonArray.length; j++) {
                            var classDiv = createClassDiv(classJsonArray[j].classColor, classJsonArray[j].classTime, classJsonArray[j].classLocation, classJsonArray[j].className, classJsonArray[j].classTime, i, j);
                            dayDivArray[i].append(classDiv);
                        }
                    }
                    else {
                        document.getElementById("initial_setup_wizard_div").style.display = "block"; //If no class data is saved, show initial setup wizard
                    }
                }
            ));

        }(i));
    }  //end FOR loop
}




//Reads data from Firebase. This only gets called at the initial page load or when the user switches between weeks.
function readTaskData() {

    var userId = firebase.auth().currentUser.uid;

    for (var i=0; i<dayDivArray.length; i++) {

        (function(i) {


            //Fetch task data
            firebase.database().ref('/users/' + userId + "/" + currentlyActiveWeekDates[i]).once('value', (function(snapshot) {
                    if (snapshot.val() !== null) {   // if there are no tasks for the day it'll return null and we move onto the next day

                        dayTaskJsonArray[i] = snapshot.val();
                        for (var j=0; j<dayTaskJsonArray[i].length; j++) {
                            var addedTaskDiv = createAddedTaskDiv(dayTaskJsonArray[i][j].taskText, i, dayTaskJsonArray[i][j].taskClassIndex); //Calls function createAddedTaskDiv and passes in the necessary values to create a new addedTaskDiv, then return the new object and save it as a var.
                            classDivArray[i][dayTaskJsonArray[i][j].taskClassIndex].insertBefore(addedTaskDiv, classDivArray[i][dayTaskJsonArray[i][j].taskClassIndex].lastChild);  //Inserts addedTaskDiv before the last child element of the classDivArray.
                        }
                    }

                    if (i === dayDivArray.length - 1) {
                        hideOrShowDayDivs();
                    }
                }
            ));

        }(i));
    }  //end FOR loop

}




//Write class data from initial setup wizard
document.getElementById("wizard_submit_button").addEventListener("click", function() {

    var classJsonObject = [
        {
            classColor: "lightblue",
            classDays: "M W F",
            classLocation: "Wexler Hall A119",
            className: document.getElementById("wizard_class_1_input").value,
            classTime: "6:00pm-7:15pm"
        },
        {
            classColor: "#ffa197",
            classDays: "Tu Th",
            classLocation: "Physical Science Bldg. 112",
            className: document.getElementById("wizard_class_2_input").value,
            classTime: "5:00pm-7:00pm"
        },
        {
            classColor: "palegreen",
            classDays: "M W F",
            classLocation: "Goldwater 334",
            className: document.getElementById("wizard_class_3_input").value,
            classTime: "7:45pm-8:30pm"
        }
    ];

    var userId = firebase.auth().currentUser.uid;

    //write class data to Firebase
    firebase.database().ref('users/' + userId + "/classes").set(classJsonObject);
});




document.getElementById("sign_in_google_button").addEventListener("click", function() {
    firebase.auth().signInWithPopup(googleProvider).then(function(result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;

        window.location.reload(); //Reload the page if the user signs in.

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

        window.location.reload(); //Reload the page if the user signs in.

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


document.getElementById("settings_item_sign_out").addEventListener("click", function() {
    firebase.auth().signOut().then(function() {
        window.location.reload(); //Reload the page if the user signs out. By doing this, we can avoid including a lot of code for resetting the environment for when a different user signs in.

    }).catch(function(error) {
        // An error happened.
        alert("Sign-out error occurred \n" + "Error code: " + errorCode + "\nError message: " + errorMessage);
    });
});



function initializeSettingsButton(bUserSignedIn) {

    var settingsButton = document.getElementById("settings_button");
    var settingsList = document.getElementById("settings_list");

    //When the user clicks on the button, toggle between hiding and showing the dropdown list
    settingsButton.addEventListener("click", function () {
        if (bUserSignedIn) {
            settingsList.classList.toggle('show');
            document.getElementById('settings_item_initial_setup_wizard').style.display = "block";
            document.getElementById('settings_item_sign_out').style.display = "block";
            //TODO: above is not working if you're signed out at page load and then sign in (is initializeSettingsButton not getting called after signing in?)
        }
        else {
            settingsList.classList.toggle('show');
            document.getElementById('settings_item_initial_setup_wizard').style.display = "none";
            document.getElementById('settings_item_sign_out').style.display = "none";
        }

    });

    settingsButton.addEventListener("mouseover", function () {
        settingsButton.src = "img/settings_black.png";
    });

    settingsButton.addEventListener("mouseout", function () {
        if (!settingsList.classList.contains('show')) {
            settingsButton.src = "img/settings_gray.png";
        }
    });


// Close the dropdown menu if the user clicks outside of it
    window.onclick = function (event) {
        if (!event.target.matches('.dropdownButton')) {
            settingsList.classList.remove('show');
            settingsButton.src = "img/settings_gray.png";
        }
    };

    document.getElementById("settings_item_initial_setup_wizard").addEventListener("click", function () {
        alert("initial setup wizard");
    });

    document.getElementById("settings_item_about_this_app").addEventListener("click", function () {
        alert("Created by Gavin and Adam Wright, 2017");
    });

}

/******************************************************/
/*****************END FIREBASE CODE********************/
/******************************************************/
