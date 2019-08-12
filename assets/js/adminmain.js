$(document).ready(initializeApp);

var helpUpdateTimer = null;

var timers = {
    classRosterTimer: null
}

function initializeApp(){
    addEventListeners();
    initiateLogin();
    loadClassList();

    showCurrentHelpList();
    helpUpdateTimer = setInterval( showCurrentHelpList, 10000);
    addRevealerFunctionality();
    addStudentMenuHandlers();
}
function addEventListeners(){
    $("#modalShadow").hide();
    $("#cohortSelect").change(showCohortMembers);
    //$("#modalClose,#modalShadow").click(closeModal);
    $("#rosterButton").click(hideStudentWork)
    $("#logoutButton").click(logout);
}
function handleUserLoggedIn(response){
    if(response.success){
        hideModal();
        userData = response.data;
    } else {
        alert('error with login');
    }
}
function loadClassList(){
    $.ajax({
        url: 'api/class.php',
        method: 'get',
        dataType: 'json',
        success: populateClassList
    })
}

function populateClassList(response){
    $("#cohortSelect").empty();
    if(response.success){
        var classList = response.data;
        var classOptionArray = [$("<option>",{
            value: 'na',
            text: 'select a class',
        })];
        for( var classIndex = 0; classIndex <classList.length; classIndex++){
            var classOption = $("<option>",{
                value: classList[classIndex].id,
                text: `${classList[classIndex].name}: ${classList[classIndex].location}`,
                'data-location': classList[classIndex].location
            });
            classOptionArray.push( classOption);
        }
        $("#cohortSelect").append(classOptionArray);
        
    }
}

function showCohortMembers(event){
    var cohortID = this.value;
    if(cohortID === 'na'){
        return;
    }
    var classLocation = $(this).find(':selected').attr('data-location');
    console.log('id: '+cohortID);
    $.ajax({
        url: 'api/class.php',
        method: 'get',
        dataType: 'json',
        data: {
            id: cohortID,
            topic: $("#lessonTopics").val()
        },
        success: populateCohortMembers.bind(this, classLocation)
    })
}

function populateCohortMembers( location, response ){
    var warningLevelColors = ['greenLevel','yellowLevel','orangeLevel','redLevel'];
    if( response.success){
        var studentMap = {};
        timers.classRosterTimer = setTimeout(function(){
            $("#cohortSelect").trigger('change');
        },10000);
        $("#studentList").empty().attr('data-location', location);
        var studentList = response.data.students;
        var studentCount = parseInt(response.data.studentCount);
        // var currentParesedDateTime = parseDateString(response.data.currentServerTime);
        var currentMilliseconds = getDateObjectFromDateString(response.data.currentServerTime).getTime();
        for( var studentIndex = 0; studentIndex < studentList.length; studentIndex++){
            if(studentList[studentIndex]!==undefined){
                var student = studentList[studentIndex];
                if(student.attemptCount===null){
                    student.attemptCount=0;
                    var lastAttemptDuration =  'na'
                    var displayColor = 'unknownLevel'
                } else {
                    // var parsedDateTime = parseDateString(student.lastAttempt);
                    
                    // var lastAttemptDate = new Date(
                    //     parsedDateTime.year,
                    //     parsedDateTime.month-1,
                    //     parsedDateTime.date, 
                    //     parsedDateTime.hour, 
                    //     parsedDateTime.minute,
                    //     parsedDateTime.second
                    // )
                    // var lastAttemptMilliseconds = lastAttemptDate.getTime();
                    var lastAttemptMilliseconds = getDateObjectFromDateString(student.lastAttempt);
                    var timeDifference = currentMilliseconds - lastAttemptMilliseconds;
    
                    var warningLevel = Math.floor(student.attemptCount/4);
                    var displayColor = warningLevelColors[ warningLevel ];
                    lastAttemptDuration = convertMillisecondsToNearestHumanTime(timeDifference) + ' ago';

                }
                var element = prepareElement('.studentDesk',{
                    '.studentName': student.name,
                    '.lessonInfo': `${student.currentTopic}:${student.title}`,
                    '.lessonAttempts': student.attemptCount,
                    '.lastAttempt': lastAttemptDuration
                });
                element.click( getStudentWork.bind(null, student, student.currentLessonID)); //had to pass something in, because bind passes in an event?
                    
                element.addClass(displayColor);
            } else {
                var element = prepareElement('.studentDesk',{
                    '.studentName': 'EMPTY',
                    '.lessonInfo': '',
                    '.lessonAttempts': '',
                    '.lastAttempt': ''
                });     
                element.addClass('empty');           
            }

            $("#studentList").append(element);
            
        }
        populateCompletionList(response.data.completionData, studentCount, studentMap);
        console.log(studentMap);
    }
}

function populateCompletionList( completionData, studentCount, studentMap ){
    var lessonMap = {};

    for(var completionIndex = 0; completionIndex < completionData.length; completionIndex++){
        var singleLessonData = completionData[completionIndex];
        var completionID = singleLessonData.lessonID;
        var completionStatus = singleLessonData.status;
        if(lessonMap.hasOwnProperty(completionID)){
            lessonMap[completionID].completionCounts[completionStatus]=singleLessonData.completionCount;
            lessonMap[completionID].studentStatus[completionStatus]=createStudentIDMap( singleLessonData.userIds);
        } else {
            lessonMap[completionID] = {
                lessonID: completionID,
                completionCounts: {
                    'complete': 0,
                    'incomplete': 0
                },
                studentStatus: {
                    'complete': [],
                    'incomplete': []
                }
            }
            lessonMap[completionID].completionCounts[completionStatus]= singleLessonData.completionCount;
            lessonMap[completionID].studentStatus[completionStatus] = createStudentIDMap( singleLessonData.userIds, studentMap)
            // lessonMap[completionID] = {
            //     lessonID: completionID,
            //     completionCounts: {
            //         [completionStatus] : singleLessonData.completionCount,
            //     },
            //     studentStatus: {
            //         [completionStatus] : createStudentIDMap( singleLessonData.userIds, studentMap)
            //     }
            // }
        }
    }
/*
          <div class="lessonSummaryItem">
                <div class="lessonNumber">1</div>
                <div class="percentStudentsCompleted">34%</div>
                <div class="averageFailureCount">5</div>
          </div>
          */
    $("#lessonCompletionList").empty();
    for(var key in lessonMap){
        var thisLesson = lessonMap[key];
        var statusElement = prepareElement('.lessonSummaryItem',
            {
                '.lessonNumber': thisLesson.lessonID,
                '.percentStudentsCompleted': Math.round(((thisLesson.studentStatus.complete.uniqueIDs/studentCount||0))*10000)/100+'% complete',
                '.averageFailureCount': Math.round(((thisLesson.completionCounts.incomplete||0)/studentCount)*100)/100 + ' fails / student'
            }
        );
        $("#lessonCompletionList").append(statusElement);
    }
}

function createStudentIDMap( idString, studentLessonMap ){
    var idArray = idString.split(',');
    var studentIDMap = {};
    var uniqueEntries = 0;
    for( var idIndex = 0; idIndex < idArray.length; idIndex++){
        var currentUserID = idArray[idIndex];
        if(studentLessonMap!==undefined){
            if(studentLessonMap.hasOwnProperty(currentUserID)){
                studentLessonMap[currentUserID].completedLessonIDs.push( idArray[idIndex] );
            } else {
                studentLessonMap[currentUserID] = {
                    completedLessonIDs: [ idArray[idIndex] ]
                }
            }
            if(studentIDMap.hasOwnProperty(  currentUserID )){
                studentIDMap[ idArray[idIndex] ]++;
            } else {
                studentIDMap[ idArray[idIndex] ] = 1;
                uniqueEntries++;
            }
        } else {
            studentLessonMap = {
                currentUserID : {
                    completedLessonIDs: []
                }
            }
        }
    }
    studentIDMap.uniqueIDs = uniqueEntries;
    return studentIDMap;
}

function getStudentWork(student, lessonID){
    $("#attemptList").empty();
    $.ajax({
        url: 'api/code.php',
        method: 'get',
        dataType: 'json',
        data: {
            lessonID: lessonID,
            studentID: student.studentID
        },
        success: displayStudentWork.bind(null, student)
    })
}
/*
                <div class="studentName"></div>
                <div class="lessonAttempts"></div>
                <div class="lessonObjective"></div>
                <div class="lessonSideBar"></div>
              */

function displayStudentWork( student, response ){
    if(response.success){
        var studentInfoDiv = $("#studentLessonInfo");
        var studentAttemptList = $("#attemptList").empty();
        studentInfoDiv.show();
        studentInfoDiv.find('.studentName').text(student.name);
        studentInfoDiv.find('.lessonAttempts').text("Attempts: "  + student.attemptCount);
        studentInfoDiv.find('.lessonObjective').html(response.data.lessonData.prompt);
        studentInfoDiv.find('.lessonSideBar').html(response.data.lessonData.sidebarInfo);
        var currentTime = getDateObjectFromDateString( response.data.lessonData.currentTime).getTime();
        for( var submissionIndex = 0; submissionIndex < response.data.submissions.length; submissionIndex++){
            var submissionData = response.data.submissions[ submissionIndex ];
            

            var element = prepareElement('.studentLessonSubmission',{
                '.submissionID': submissionData.lessonID,
                '.submitted': submissionData.submitted,
                '.submittedElapsed': convertMillisecondsToNearestHumanTime( currentTime - getDateObjectFromDateString(submissionData.submitted).getTime()),
                '.studentCode': submissionData.code,
                '.codeErrorMessage': submissionData.error
            }); 
            if(submissionData.status==='complete'){
                element.addClass('correctSubmission');
            }  
            studentAttemptList.append(element);
        }
    }
    fetchLessonDataByTopic( student.currentTopic, student );
}

function handleUserLoggedIn(response){
    if(response.success){
        hideModal();
        userData = response.data;
        console.log('logged in');
    } else {
        alert('error with login');
    }
}

function hideStudentWork(){
    $("#studentLessonInfo").hide();
}

function fetchLessonDataByTopic( topic, user ){
    $.ajax({
        url: 'api/lesson.php',
        method: 'get',
        dataType: 'json',
        data: {
            topic: topic,
            studentID:  user.studentID
        },
        success: function( response ){
            displayLessonList( response, "#lessonList", handleLessonClick, loadPastAttempts, user);
        }
    })      
}

function handleLessonClick(lessonData, user){
    console.log('lesson data', lessonData, user)
    getStudentWork(user, lessonData.id)
}

function loadPastAttempts(){
    console.log('loaded attempts')
}

function addStudentMenuHandlers(){
    $("#addCohort").click( addCohortToSystem );
}

function addCohortToSystem(){
    var cohortID = $("#cohortName").val();
    var studentListRaw = $("#cohortRoster").val();
    var cohortLocation = $("#cohortLocation").val();
    var studentLines = studentListRaw.split('\n');
    var students = [];
    for( var studentI = 0; studentI < studentLines.length; studentI++){
        var studentData = studentLines[studentI].split('\t');
        students.push( { name: studentData[0], email: studentData[1]})
    }
    $.ajax({
        url: 'api/users.php',
        method: 'post',
        dataType: 'json',
        data: {
            users: students, 
            cohortName: cohortID,
            location: cohortLocation
        },
        success: handleUsersAdded
    })
}

function handleUsersAdded( response ){
    if(response.success){
        loadClassList();
    }
}

function showCurrentHelpList(){
    $.ajax({
        url: 'api/help.php',
        dataType: 'json',
        data: {
            'type': 'all'
        },
        method: 'get',
        success: handleHelpListRetrieved, 
        error: function(){
            console.log('help request failed'); 
        }
    })
}

function handleHelpListRetrieved( response ){

    $("#helpList").empty();
    if(response.data.requests.length===0){
        $("#helpList").text('No requests available');
    }
    var serverTime = getDateObjectFromDateString( response.data.serverTime);
    for( var helpIndex = 0; helpIndex < response.data.requests.length; helpIndex++){
        var data = response.data.requests[helpIndex];
        var requestTime = getDateObjectFromDateString( data.requested );
        var timeDifference =  serverTime - requestTime;

        requestDuration = convertMillisecondsToNearestHumanTime(timeDifference) + ' ago';
        var requestDom = prepareElement('.helpEntry',{
            '.userName': data.name,
            '.lessonTopic': data.lessonTopic,
            '.lessonTitle': data.lessonTitle,
            '.problemType': data.topic,
            '.location': data.location,
            '.seatingLocation': data.positionID,
            '.requested': requestDuration,
            '.requestCount': data.requests,
            '.problem': data.problem
        })
        requestDom.find('.problemRevealer').attr('data-revealerID', 'problem-'+data.id);
        requestDom
            .find('.AcceptProblem')
                .attr('data-requestID', data.id)
                .addClass( data.status )
                .text( data.status)
                .attr('data-currentStatus', data.status )
                .click( acceptHelpRequest );

        $("#helpList").append(requestDom);
    }
    addRevealerFunctionality();
}

function acceptHelpRequest(event){
    var targetID = $(event.target).attr('data-requestID');
    $.ajax({
        url: 'api/help.php',
        method: 'patch',
        dataType: 'json',
        data: {
            helpId: targetID, 
            status: $(event.target).attr('data-currentStatus')
        },
        success: handleHelpRequestResponse
    })
}

function handleHelpRequestResponse( response ){
    if(response.success){
        showCurrentHelpList();
    }
}