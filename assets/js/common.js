let userData = {
    currentTopic: null,
    currentLessonID: null,
    currentLessonOrderID: null,
    cohort: null,
    id: null,
    name: null
};

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
function login(callbackFunction){
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

function initiateLogin(){
    const loginSection = prepareElement('.login', {
        '.loginButton':'login'
    })
    loginSection.find('.loginButton').click( login )
    showModal( loginSection );
}

function parseDateString( dateTimeString ){
    var dateTimePieces = dateTimeString.split(' ');
    var datePieces = dateTimePieces[0].split('-');
    var timePieces = dateTimePieces[1].split(':');
    var parsedDateTime = {
        year: parseInt(datePieces[0]),
        month: parseInt(datePieces[1]),
        date: parseInt(datePieces[2]),
        hour: parseInt(timePieces[0]),
        minute: parseInt(timePieces[1]),
        second: parseFloat(timePieces[2])
    }
    return parsedDateTime;
}

function getDateObjectFromDateString( dateTimeString ){
    var dateTimeObject = parseDateString(dateTimeString);
    return new Date(
        dateTimeObject.year,
        dateTimeObject.month-1,
        dateTimeObject.date, 
        dateTimeObject.hour, 
        dateTimeObject.minute,
        dateTimeObject.second
    )
}

function convertMillisecondsToNearestHumanTime( microTime ){
    var seconds = microTime / 1000;
    if( seconds < 60){
        return `${Math.floor(seconds)} seconds`;
    }
    var minutes = seconds / 60;
    if( minutes < 60){
        return `${Math.floor(minutes)} minutes`;
    }
    var hours = minutes / 60;
    if( hours < 24){
        return `${Math.floor(hours*100)/100} hours`;
    }
    var days = hours / 24;
    if( days < 7){
        return `${Math.floor(days*100)/100} days`;
    }
    var weeks = days / 7;
    if( weeks < 4){
        return `${Math.round(weeks)} weeks`;
    }
    return 'over a month';
}