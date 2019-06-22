let userData = {
    currentTopic: null,
    currentLesson: null,
    cohort: null,
    id: null,
    name: null
};
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
function handleError( error ){
    console.log(error);
    showModal(`<div class='error'>${error}</div>`);
}
function subConsoleLog(output){
    $("#outputArea").val(output);
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
    $(".attention").removeClass('attention');
    finalCode = `var __currentTime = ${Date.now()};` + finalCode.replace('console.log', 'subConsoleLog');
    $("#codeSubstitute").empty();
    //$("#codeSubstitute").text(finalCode);
    window.eval(finalCode);
    let result;
    try{
        result = __test();
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

function closeModal(event){
    if(event.target !== event.currentTarget){
        return;
    }
    hideModal();
}
function hideModal(){
    $("#modalShadow").hide(250);
}
function showModal(content){
    $("#modalMessage").empty().append(content);
    $("#modalShadow").show(250);
}
function prepareElement(target, config){
    const clone = $("#templates "+target).clone();
    for( let key in config){
        clone.find(key).text( config[key]);
    }
    return clone;
}
function login(){
    const email = $("#modalBody .email").val();
    $.ajax({
        url: 'api/login.php',
        method: 'post',
        dataType: 'json',
        data: {
            email: email
        },
        success: handleUserLoggedIn
    })
}
function handleUserLoggedIn(response){
    if(response.success){
        hideModal();
        userData = response.data;
        fetchLessonData(userData.currentTopic, userData.currentLesson);
    } else {
        alert('error with login');
    }
}
function initiateLogin(){
    const loginSection = prepareElement('.login', {
        '.loginButton':'login'
    })
    loginSection.find('.loginButton').click( login )
    showModal( loginSection );
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
    $("#lessonExample").html( data.sideBarInfo );
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
    debugger;
    if( response.success ){
        if( response.data.nextLessonID !== userData.currentLesson || response.data.topic !== userData.currentTopic){
            debugger;
            fetchLessonData( response.data.topic, response.data.nextLessonID );
        }
    }
}