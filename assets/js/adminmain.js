$(document).ready(initializeApp);


function initializeApp(){
    addEventListeners();
    initiateLogin();
}
function addEventListeners(){
    $("#modalShadow").hide();
    $("#cohortSelect").change(showCohortMembers);
    //$("#modalClose,#modalShadow").click(closeModal);
    loadClassList();
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
            id: cohortID
        },
        success: populateCohortMembers.bind(this, classLocation)
    })
}

function populateCohortMembers( location, response ){
    var warningLevelColors = ['greenLevel','yellowLevel','orangeLevel','redLevel'];
    if( response.success){
        $("#studentList").empty().attr('data-location', location);
        var studentList = response.data.students;
        var currentParesedDateTime = parseDateString(response.data.currentServerTime);
        for( var studentIndex = 0; studentIndex < 22; studentIndex++){
            if(studentList[studentIndex]!==undefined){
                var student = studentList[studentIndex];
                if(student.attemptCount===null){
                    student.attemptCount=0;
                    var lastAttemptDuration =  'na'
                    var displayColor = 'unknownLevel'
                } else {
                    var parsedDateTime = parseDateString(student.lastAttempt);
                    
                    var lastAttemptDate = new Date(
                        parsedDateTime.year,
                        parsedDateTime.month-1,
                        parsedDateTime.date, 
                        parsedDateTime.hour, 
                        parsedDateTime.minute,
                        parsedDateTime.second
                    )
                    var lastAttemptMilliseconds = lastAttemptDate.getTime();
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
            /*
            {
        '.loginButton':'login'
    }*/
        }
    }
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