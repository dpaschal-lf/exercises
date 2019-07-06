
$(document).ready(initializeApp);

var currentTest = null;

function initializeApp(){
    addEventListeners();
    initiateLogin();
}
function addEventListeners(){
    $("#modalShadow").hide();
    $("#submitCodeButton").click(renderEditedCode);
    $("#modalClose,#modalShadow").click(closeModal);
    $("#logoutButton").click(logout);
    $("#codeAttempts .closeCodeAttempts").click(closeCodeAttempts)
}
function handleUserLoggedIn(response){
    if(response.success){
        storeLocalData('userEmail', response.data.email);
        hideModal();
        userData = response.data;
        fetchLessonDataByID(userData.currentLessonID);
        fetchLessonDataByTopic(userData.currentTopic);
    } else {
        alert('error with login');
    }
}
function handleError( error , fakeConsoleError = false){
    console.log(error);
    showModal(`<div class='error'>${error}</div>`);
    if(fakeConsoleError){
        subConsoleLog(fakeConsoleError);
    }
}
function subConsoleLog(output){
    var outputText = '';
    for( var argI = 0; argI < arguments.length; argI++){
        outputText = JSON.stringify(arguments[argI]) + '\n';
    }
    console.log(outputText);
    $("#outputArea").val(outputText);
    console.log.apply(null, arguments);
}
function renderEditedCode(){
    const initialCode = $("#codeInput").val();
    var finalCode = initialCode.replace('console.log', 'subConsoleLog');
    $("#outputArea").val('');
    $(".attention").removeClass('attention');
    // var currentTest = `    
    // if(a!==20 || moo!=='haha'){
    //   return 'shit went south';
    // } else {
    //   return true;
    // }`;
    var observer = `  
    return function(code, attention){
      ${currentTest}
    }`;
    try{
        var outer = Function(`
            try{
                ${finalCode};
                ${observer}
            } catch(error){
                handleError(error);
                throw (error);
            }
        `)
    } catch(error){
        handleError(error);
        return;
    }
    if(window.failed){
        return false;
    }
    var innerObserver = outer();
    var result = innerObserver(initialCode, attention);

    //use strict causes a race condition?
    console.log(result);
    $("#codeSubstitute").empty();
    //$("#codeSubstitute").text(finalCode);

    try{
        if(result!==true){
            handleError(result);
            submitCodeResponse( initialCode, userData.currentLessonID, result );
        } else {
            submitCodeResponse( initialCode, userData.currentLessonID );
        }
    } catch( error ){
        handleError(error);
    }

}



function fetchLessonDataByID( lessonID ){
    $.ajax({
        url: 'api/lesson.php',
        method: 'get',
        dataType: 'json',
        data: {
            id: lessonID,
        },
        success: handleGetLessonInfo
    })    
}

function fetchLessonDataByTopic( topic ){
    $.ajax({
        url: 'api/lesson.php',
        method: 'get',
        dataType: 'json',
        data: {
            topic: topic,
        },
        success: function(response){
            displayLessonList(response, '#lessonList', changeLesson, loadPastAttempts, userData);
        }
    })      
}


function loadPastAttempts( lessonID ){
    event.stopPropagation();
    $.ajax({
        url: 'api/code.php',
        method: 'get',
        dataType: 'json',
        data: {
            lessonID: lessonID
        },
        success: displayUserLessons
    })      
}

function displayUserLessons( response ){
    if(response.success){  
        var outputArea = $("#codeAttempts");
        var codeArea = outputArea.find('.attemptsData').empty();
        outputArea.show(200);
        console.log(response.data.lessonData);
        outputArea.find('.attemptPrompt').html(response.data.lessonData.prompt);
        outputArea.find('.attemptSidebar').html(response.data.lessonData.sidebarInfo);
        for(var codeAttemptIndex = 0; codeAttemptIndex < response.data.submissions.length; codeAttemptIndex++){
            var submission = response.data.submissions[codeAttemptIndex];
            var element = prepareElement('.studentLessonSubmission',{
                '.submissionID': codeAttemptIndex,
                '.submitted': submission.submitted,
                '.submittedElapsed': 'ago',
                '.codeErrorMessage': submission.error
            });
            element.find('.studentCode').html(`<code><pre>${submission.code}</pre></code>`);
            codeArea.append(element);
        }
    }
}

function changeLesson( lesson){
    userData.currentLessonID= lesson.id;
    userData.currentLessonOrderID = lesson.orderID;
    updateUserLesson( lesson );
    fetchLessonDataByID(lesson.id);
}

function updateUserLesson( lesson ){
    $.ajax({
        url: 'api/users.php',
        method: 'patch',
        dataType: 'json',
        data: {
            id: lesson.id,
            orderID: lesson.orderID
        },
        success: handleUserLessonUpdated
    })    
}
function handleUserLessonUpdated( response ){
    if(response.success){
        highlightActiveLesson(response.data.lessonID );
    }
}



function handleGetLessonInfo(response){
    if(response.success){
        displayQuestionData(response.data);
    }
}

function displayQuestionData(data){
    $("#lessonTitle").empty().append(data.title + `<strong>(${data.orderID}/${data.total})</strong>`);
    $("#lessonSection").html( data.prompt);
    $("#lessonExample").html( data.sidebarInfo );
    $("#codeInput").val(data.prepCode);
    try{
        currentTest = data.test;
        // $("#tester").html(data.test);
    } catch( error ){
        console.error('error in eval: ' + error);
    }
}

function attention( itemIndex ){
    $(`span[data-index=${itemIndex}]`).addClass('attention');
}

function submitCodeResponse(code, lessonID, error='pass'){
    const data = {
        id: lessonID,
        code: code,
        status: error
    }
    $.ajax({
        url: 'api/code.php',
        method: 'put',
        dataType: 'json',
        data: data,
        success: handleCodeSubmitted
    }); 
}

function handleCodeSubmitted( response ){
    if( response.success ){
        if( response.data.nextLessonID != userData.currentLessonID){
            showModal( "<h1 class='correct'>Correct!</h1>" );
            userData.currentLessonID=response.data.nextLessonID;
            userData.currentTopic = response.data.topic;
            fetchLessonDataByID( response.data.nextLessonID );
        }
        fetchLessonDataByTopic( response.data.topic );
    }
}

function closeCodeAttempts(){
    $("#codeAttempts").hide(150);
}