function attention( id ){
    $("[data-index="+id+"]").addClass('marked')
}  


function testCode(code){
    $(".marked").removeClass('marked');

    /* student code subbed here*/
    eval(code);
    /* end student subbed code */
    /* start tests */
    if(typeof t1 === 'undefined' || t1 !== 'daniel'){
        attention(3);
        return "<code>t1</code> should be defined and <code>'daniel'</code>"
    }
    if(typeof t2 === 'undefined' || t2 !== 'david'){
        attention(3);
        return "<code>t2</code> should be defined and <code>'david'</code>"
    }
    if(typeof answer === 'undefined'){
        attention(2);
        return '<code>answer</code> must be defined'
    }
    if(/answer += *false/.test(code)){
        attention(1);
        return "Don't set <code>answer</code> manually to false, use a comparison!"
    }
    if(answer !== t1 > t2){
        attention(1);
        return `<code>answer</code> must be a check if <code>t1</code> is greater than <code>t2</code>`
    }
    if(!/var +answer *= *t1 *> *t2/.test(code)){
        attention(4);
        return `<code>answer</code> was not tested correctly.`
    }
    return true;

    /* end tests */
}

