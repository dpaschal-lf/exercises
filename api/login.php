<?php
require_once('functions.php');
set_exception_handler('error_handler');
require_once('config.php');
require_once('mysql_connect.php');

$relogin = false;

if(empty($_POST['token'])){
    if(empty($_POST['email'])){
        throw new Exception('email must be specified');
    }
    if(empty($_POST['password'])){
        throw new Exception('password must be supplied');
    }
    $query = "SELECT 
            u.id, u.email, u.name, u.cohortID, u.currentLessonID, u.currentLessonOrderID, u.currentTopic,
            c.name AS cohortName, c.location
        FROM users AS u 
        JOIN classes AS c
            ON u.cohortID = c.id
        WHERE email=? AND password=?";
    $hashedPassword = hash('sha256', $salt.$_POST['password']);
    unset($_POST['password']);
    $whereValues = [$_POST['email'], $hashedPassword ];
} else {
    $relogin = true;
    $query = "SELECT 
            u.id, u.email, u.name, u.cohortID, u.currentLessonID, u.currentLessonOrderID, u.currentTopic,
            c.name AS cohortName, c.location
        FROM activeSessions AS s
        JOIN users AS u
            ON s.userID = u.id 
        JOIN classes AS c
            ON u.cohortID = c.id
        WHERE s.token=?";
    $whereValues = [$_POST['token']];
}


$result = prepare_statement($query, [$_POST['email'],$hashedPassword]);

if(!$result){
    throw new Exception('error with query');
}

if($result->num_rows===0){
    throw new Exception('no such user');
}

$data = $result->fetch_assoc();

session_start();

$_SESSION['userID'] = $data['id'];

$output = [
    'success'=>true,
    'data'=>[
        'id'=>$data['id'],
        'name'=>$data['name'],
        'email'=>$data['email'],
        'cohort'=>$data['cohortID'],
        'currentTopic'=>$data['currentTopic'],
        'currentLessonID'=>$data['currentLessonID'],
        'currentLessonOrderID'=>$data['currentLessonOrderID']
    ]
];

if(!$relogin){
    $token = hash('sha256', $externalSalt.$_POST['email'].$hashedPassword);
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