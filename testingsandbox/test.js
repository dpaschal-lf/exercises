function attention( id ){
    $("[data-index="+id+"]").addClass('marked')
}  


function testCode(code){
    $(".marked").removeClass('marked');

    /* student code subbed here*/
    eval(code);
    /* end student subbed code */
    /* start tests */
    if(typeof testMe === 'undefiend' && testMe !== true){
        attention(1);
        return `The variable <code>testMe</code> should be defined and be <code>true</code>`
    }
    if( typeof result === 'undefined' || result !== true){
        attention(2);
        return `The variable <code>result</code> must exist and be true.`
    }
    if(!/if\( *testMe *\)/.test(code)){
        attention(3);
        return `You must have the variable <code>testMe</code> in between the parenthesis of the if statement`;
    }
    if(!/{.*result *= *true.*}/s.test(code)){
        attention(3);
        return `You must have the variable <code>result</code> in between the curly braces of the if statement`;
    }
    return true;

    /* end tests */
}

