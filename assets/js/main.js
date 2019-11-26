
$(document).ready(initializeApp);

var currentTest = null;
var helpActiveCheckTimer = null;

function initializeApp(){
    addEventListeners();
    initiateLogin();
}
function addEventListeners(){
    $("#modalShadow").hide();
    $("#submitCodeButton").click(renderEditedCode);
    $("#modalClose,#modalShadow").click(closeModal);
    $("#logoutButton").click(logout);
    $("#codeAttempts .closeCodeAttempts").click(closeCodeAttempts);
    $("#lessonHelp").click( requestHelp );
}
function handleUserLoggedIn(response){
    if(response.success){
        storeLocalData('authToken', response.data.token);
        storeLocalData('userEmail', response.data.email);
        hideModal();
        userData = response.data;
        fetchLessonDataByID(userData.currentLessonID);
        fetchLessonDataByTopic(userData.currentTopic);
        checkHelpStatus();
        helpActiveCheckTimer = setInterval(checkHelpStatus, 10000);
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
        success: handleCodeSubmitted, 
        error: function( response ){
            console.log(response);
        }
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
    } else if(response.error.slice(0,'no further lessons'.length) === 'no further lessons'){
        showModal( "<h1 class='correct'>Correct!</h1><div>No further lessons, try back later</div>" );
    }
}

function closeCodeAttempts(){
    $("#codeAttempts").hide(150);
}
function requestHelp(){
/*
        <div class="endHelpContainer">
            <div class="confirmMessage"></div>
            <button class="completed">help Completed</button>
            <button class="helpCanceled">I don't need help anymore</button>
            <button class="cancelDialog">Oops, close this screen</button>
        </div>
        */
    var target = $(event.target);
    if(target.hasClass('helpNeeded')){
        var modalContent = prepareElement('.endHelpContainer', {
            '.confirmMessage': 'You have a pending help request, what do you wish to do?'
        });
        modalContent.find('.completed').click( completeHelpRequest );
        modalContent.find('.helpCanceled').click( endHelpRequest );
        modalContent.find('.cancelDialog').click( hideModal );
    } else {
        var modalContent = prepareElement('.helpContainer', {
            '.confirmMessage': 'You are about to request help from the staff. Are you sure?'
        });
        modalContent.find('.confirmHelp').click(requestHelpConfirm);
        modalContent.find('.cancelHelp').click( closeModal );
    }


    showModal(modalContent);
}

function requestHelpConfirm(){
    const data = {
        lessonId: userData.currentLessonID,
        helpMessage: $(".helpMessage").val(),
        helpTopic: $(".helpTopic").val()
    }
    $.ajax({
        url: 'api/help.php',
        method: 'POST',
        dataType: 'json',
        data: data,
        success: handleHelpResponse,
        error: function(){
            console.error('error updating help request')
        }
    });     
}

function handleHelpResponse(response){
    hideModal();
    console.log('closing')
    changeHelpStatus(true);
}
function changeHelpStatus( status ){
    if(status){
        $("#lessonHelp").addClass('helpNeeded')
    } else {
        $("#lessonHelp").removeClass('helpNeeded')
    }
}

function checkHelpStatus(){
    $.ajax({
        url: 'api/help.php',
        dataType: 'json',
        method: 'get',
        success: handleStatusUpdate,
        error: function(){
            console.error('error getting help status');
        }
    })
}

function handleStatusUpdate( response ){    
    if(response.success){
        changeHelpStatus( response.data.requestPending );
    }
}

function completeHelpRequest(){
    $.ajax({
        url: 'api/help.php',
        method: 'patch',
        dataType: 'json',
        data: {
            status: 'completed'
        },
        success: function(){
            hideModal();
            handleStatusUpdate();
        }
    });
}

function endHelpRequest(){
    $.ajax({
        url: 'api/help.php',
        method: 'patch',
        data: {
            status: 'cancelled'
        },
        dataType: 'json',
        success: function(){
            hideModal();
            handleStatusUpdate();
        }
    });
}

function showCreateAccountDialog(){
    const createSection = prepareElement('.createAccount', {});
    $.ajax({
        url: 'api/class.php',
        method: 'get',
        dataType: 'json',
        success: function(response){
            var classSelect = createSection.find('.classSelect');
            for( var classIndex =0; classIndex < response.data.length; classIndex++){
                var option = $("<option>",{
                    value: response.data[classIndex].id,
                    text: response.data[classIndex].name
                });
                classSelect.append(option);
            } 
            showModal(createSection);
            var password1 = createSection.find('.password1');
            var password2 = createSection.find('.password2');
            var passwordError = createSection.find('.errorMessage');
            password2.on('keyup', function(){
                if(password1.val() !== password2.val()){
                    passwordError.text('password must match');
                } else {
                    passwordError.text('');
                }
            });
            var selectElement = createSection.find('.classSelect');
            var codeInput = createSection.find('.classCodeInput');
            codeInput.hide();
            selectElement.on('change', function(){
                if(selectElement.val()==='guest'){
                    codeInput.hide();
                } else {
                    codeInput.show();
                }
            })
            createSection.find('.createAccountButton').click( submitCreateAccount.bind(null,createSection) )
        }
    })
}

function submitCreateAccount( createDialog ){
    var email = createDialog.find('.email').val();
    var password = createDialog.find('.password1').val();
    var classID = createDialog.find('.classSelect').val();
    var classCode = createDialog.find('.classCodeInput').val();
    var userName = createDialog.find('.name').val();
    $.ajax({
        url: 'api/create_account.php',
        method: 'post',
        data: {
            email: email,
            password: password,
            classID: classID,
            classCode: classCode,
            name: userName
        },
        dataType: 'json',
        success: handleAccountCreated
    });
}

function handleAccountCreated( response ){
    console.log( response );
}



