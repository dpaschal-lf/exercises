
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
    finalCode = finalCode.replace('console.log', 'subConsoleLog');
    $("#codeSubstitute").text(finalCode);
}

function closeModal(event){
    if(event.target !== event.currentTarget){
        return;
    }
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
    const email = $("#modalBody .email");
    $.ajax({
        url: 'api/login.php',
        method: 'post',
        dataType: 'json',
        success: function( response ){
            if(response.success){
                handleUserLoggedIn(response.data);
            }
        }
    })
}
function handleUserLoggedIn(data){
    console.log(data);
}
function initiateLogin(){
    const loginSection = prepareElement('.login', {
        '.loginButton':'login'
    })
    loginSection.find('.loginButton').click( login )
    showModal( loginSection );
}