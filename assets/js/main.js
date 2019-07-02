
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
}
function handleUserLoggedIn(response){
    if(response.success){
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
            debugger;
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
        success: displayLessonList
    })      
}
function displayLessonList( response ){
    if( response.success){
        var lessons = response.data.lessonList;
        //<div class="lessonNumber">#1</div><div class="lessonName">Lesson name</div>
        for( var lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++){
            var element = prepareElement('.lessonItem',{
                '.lessonNumber': lessonIndex,
                '.lessonName': lessons[lessonIndex].title
            });
            element.click( changeLesson.bind(null, lessons[lessonIndex].id));;
            $("#lessonList").append(element);
        }
    }
}

function changeLesson( lessonID ){
    userData.currentLessonID= lessonID;
    fetchLessonDataByID(lessonID);
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
        if( response.data.nextLessonID != userData.currentLesson || response.data.topic !== userData.currentTopic){
            showModal( "<h1 class='correct'>Correct!</h1>" );
            userData.currentLessonID=response.data.nextLessonID;
            userData.currentTopic = response.data.topic;
            userData.currentLessonOrderID = response.data.currentLessonOrderID;
            fetchLessonDataByID( response.data.nextLessonID );
        }
    }
}