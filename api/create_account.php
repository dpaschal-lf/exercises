<?php
require_once('functions.php');
set_exception_handler('error_handler');
require_once('config.php');
require_once('mysql_connect.php');

if(empty($_POST['password'])){
    throw new Exception('must supply a password');
}
$hashedPassword = hash('sha256', $salt.$_POST['password']);
unset($_POST['password']);

if(empty($_POST['email'])){
    throw new Exception('must supply an email');
}
if(empty($_POST['classID'])){
    throw new Exception('must supply a class id');
}
if($_POST['classID'] !== 'guest'){
    if(empty($_POST['classCode'])){
        throw new Exception('must supply a class code for this class');
    }
}

if(!$relogin){
    $token = hash('sha256', time() . $externalSalt.$_POST['email'].$hashedPassword);
    $output['data']['token'] = $token;
    $sessionQuery = "INSERT INTO activeSessions SET token = ?, userID=?, loggedIn=NOW()";
    $sessionResult = prepare_statement($sessionQuery, [$token, $data['id']]);
    if(!$sessionResult){
        throw new Exception('session query failure');
    }
    if( $sessionResult->affected_rows < 1){
        throw new Exception('session create query failed');
    }
}

print( json_encode( $output ));

?>