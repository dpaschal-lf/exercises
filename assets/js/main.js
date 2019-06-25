
$(document).ready(initializeApp);

function initializeApp(){
    addEventListeners();
    initiateLogin();
}
function addEventListeners(){
    $("#modalShadow").hide();
    $("#submitCodeButton").click(renderEditedCode);
    $("#modalClose,#modalShadow").click(closeModal);
}
function handleError( error , fakeConsoleError = false){
    console.log(error);
    showModal(`<div class='error'>${error}</div>`);
    if(fakeConsoleError){
        subConsoleLog(fakeConsoleError);
    }
}
function subConsoleLog(output){
    $("#outputArea").val(output);
}
function saferEval( codeString ){
    return Function( `"use strict"; return(${codeString})()` );
}
function renderEditedCode(){
    const initialCode = $("#codeInput").val();
    let finalCode = `
        try{
            ${initialCode}
        } catch(error){
            handleError(error);
        }
    `;
    $("#outputArea").val('');
    $(".attention").removeClass('attention');
    //use strict causes a race condition?
    finalCode = /*`"use strict"; ` + */finalCode.replace('console.log', 'subConsoleLog');
    $("#codeSubstitute").empty();
    //$("#codeSubstitute").text(finalCode);
    try{
        //saferEval(finalCode); 
        console.log(finalCode);
        window.eval(finalCode); //reference errors are currently not caught.  Need to use function version to make this work, but then have to catch variables from inside function
    } catch (error){
        handleError('error',error);
    }
    console.log('test: '+ ('test' in window));
    let result;
    try{
        result = __test(initialCode);
        if(result!==true){
            handleError(result);
            __reset();
            gotoNextQuestion( initialCode,userData.currentTopic, userData.currentLesson, result );
        } else {
            gotoNextQuestion( initialCode,userData.currentTopic, userData.currentLesson );
        }
    } catch( error ){
        handleError(error);
    }

}



function fetchLessonData( topic, lessonID ){
    $.ajax({
        url: 'api/lesson.php',
        method: 'get',
        dataType: 'json',
        data: {
            id: lessonID,
            topic: topic
        },
        success: handleGetLessonInfo
    })    
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
    try{
        window.eval( data.test );
        // $("#tester").html(data.test);
    } catch( error ){
        console.error('error in eval: ' + error);
    }
}

function attention( itemIndex ){
    $(`span[data-index=${itemIndex}]`).addClass('attention');
}

function gotoNextQuestion(code, topic, lessonID, error='pass'){
    const data = {
        id: lessonID,
        topic: topic,
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
            fetchLessonData( response.data.topic, response.data.nextLessonID );
        }
    }
}