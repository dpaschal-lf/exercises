$(document).ready(initializeApp);

var timers = {
    classRosterTimer: null
}

function initializeApp(){
    addEventListeners();
    initiateLogin();
    loadClassList();
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
        timers.classRosterTimer = setTimeout(function(){
            $("#cohortSelect").trigger('change');
        },10000);
        $("#studentList").empty().attr('data-location', location);
        var studentList = response.data.students;
        var studentCount = parseInt(response.data.studentCount);
        // var currentParesedDateTime = parseDateString(response.data.currentServerTime);
        var currentMilliseconds = getDateObjectFromDateString(response.data.currentServerTime).getTime();
        for( var studentIndex = 0; studentIndex < 24; studentIndex++){
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
        populateCompletionList(response.data.completionData, studentCount);
    }
}

function populateCompletionList( completionData, studentCount ){
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
                    [completionStatus] : singleLessonData.completionCount,
                },
                studentStatus: {
                    [completionStatus] : createStudentIDMap( singleLessonData.userIds)
                }
            }
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

function createStudentIDMap( idString ){
    var idArray = idString.split(',');
    var studentIDMap = {};
    var uniqueEntries = 0;
    for( var idIndex = 0; idIndex < idArray.length; idIndex++){
        var currentUserID = idArray[idIndex]
        if(studentIDMap.hasOwnProperty(  currentUserID )){
            studentIDMap[ idArray[idIndex] ]++;
        } else {
            studentIDMap[ idArray[idIndex] ] = 1;
            uniqueEntries++;
        }
    }
    studentIDMap.uniqueIDs = uniqueEntries;
    return studentIDMap;
}

function getStudentWork(student, lessonID){
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