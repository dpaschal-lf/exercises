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

function logout(){
    $.ajax({
        url: 'api/logout.php',
        method: 'get',
        dataType: 'json',
        success: handleUserLoggedOut
    })     
}
function handleUserLoggedOut(response){
    if(response.success){
        $("#logoutButton").hide();
        storeLocalData('userEmail', null);
        initiateLogin();

    }
}
function login(email){
    if( typeof email !=='string') {
        email = $("#modalBody .email").val()
    }
    $.ajax({
        url: 'api/login.php',
        method: 'post',
        dataType: 'json',
        data: {
            email: email
        },
        success: function(response){
            $("#logoutButton").show();
            handleUserLoggedIn(response);
        }
    })
}

function getLocalData(){
    try{
        return JSON.parse( localStorage.jsexercises);
    } catch(error){
        delete localStorage.jsexercises;
    }
    return {}
}
function storeLocalData(key, value){
    var data = getLocalData();
    if(value===null){
        delete data[key];
    } else {
        data[key] = value;
    }

    localStorage.jsexercises = JSON.stringify(data);
}

function initiateLogin(){
    if( getLocalData().userEmail ){
        login(getLocalData().userEmail);
    }
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
function displayLessonList( response, destination= "#lessonList", lessonClickCallback, countClickCallback, user){
    if( response.success){
        var lessons = response.data.lessonList;
        //<div class="lessonNumber">#1</div><div class="lessonName">Lesson name</div>
        var itemCount = 0;
        console.log(user);
        $(destination).empty();
        for( var lessonIndex in lessons){
            var element = prepareElement('.lessonItem',{
                '.lessonNumber': itemCount++,
                '.lessonName': lessons[lessonIndex].title,
                '.attemptCount': (lessons[lessonIndex].incompleteCount||0) + (lessons[lessonIndex].completeCount||0)
            });
            element.find('.attemptContainer').click( countClickCallback.bind(null, parseInt(lessonIndex)))
            if(lessons[lessonIndex].completeCount){
                element.find('.lessonStatus').html( '&check;' );
            }
            
            if(lessons[lessonIndex].id===user.currentLessonID){
                element.addClass('currentLessonHighlight');
            }
            element.attr('data-lessonID', lessons[lessonIndex].id);
            element.click( lessonClickCallback.bind(null, lessons[lessonIndex],user));;
            $(destination).append(element);
        }
    }
}
function highlightActiveLesson( id ){
    $('.currentLessonHighlight').removeClass('currentLessonHighlight');
    $('.lessonItem[data-lessonid='+id+']').addClass('currentLessonHighlight');
}