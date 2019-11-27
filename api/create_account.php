<?php
require_once('functions.php');
set_exception_handler('error_handler');
require_once('config.php');
require_once('mysql_connect.php');


$startLessonID = 1;
$startLessonTopic = 'variables';

if(empty($_POST['password'])){
    throw new Exception('must supply a password');
}
$hashedPassword = hash('sha256', $salt.$_POST['password']);

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
} else {
    $codeQuery = 'SELECT `id` FROM `classes` WHERE `id`=? AND `entryCode`=?';

    $codeResult = prepare_statement( $codeQuery , [$_POST['classID'], $_POST['classCode']]);

    if(!$codeResult){
        throw new Exception('error checking for class code');
    }
    if($codeResult->num_rows<1){
        throw new Exception('invalid code '. $_POST['classCode']);
    }
}

$emailCheckQuery = "SELECT `email` FROM `users` WHERE `email` = ?";

$emailCheckResult = prepare_statement( $emailCheckQuery, [$_POST['email']]);

if(!$emailCheckResult){
    throw new Exception('query error checking for email presence');
}

if($emailCheckResult->num_rows>0){
    throw new Exception('that email is already in use');
}

$query = "INSERT INTO `users` SET
    `email`=?, `password`=?, `name`=?, `rights`=0, `cohortID`=?,
    `currentLessonID`=?, `currentTopic`=?
";

$result = prepare_statement( $query , [ $_POST['email'], $hashedPassword, $_POST['name'], $_POST['classID'], $startLessonID, $startLessonTopic]);

if(!$result){
    throw new Exception('error sending account creation query');
}
if($result->affected_rows < 1){
    throw new Exception('error in account creation query');
}

// $output = ['success'=>true];
$pathInfo = pathinfo($_SERVER['REQUEST_URI']);
$postDataString ="email={$_POST['email']}&password={$_POST['password']}";
$curlID = curl_init($_SERVER['HTTP_ORIGIN'].$pathInfo['dirname'].'/login.php');
curl_setopt($curlID, CURLOPT_POST, true);
curl_setopt($curlID, CURLOPT_POSTFIELDS, $postDataString);
$something = curl_exec($curlID);

//print( json_encode( $output ));

?>