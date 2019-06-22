<?php
require_once('mysql_connect.php');
require_once('functions.php');
set_exception_handler('error_handler');

if(empty($_POST['email'])){
    throw new Exception('email must be specified');
}

$query = "SELECT * FROM users WHERE email=?";

$statement = $db->prepare($query);

if(!$statement){
    throw new Exception('error with prepared statement: '.$db->error);
}

$statement->bind_param('s',$_POST['email']);

$statement->execute();

$result = $statement->get_result();

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
        'cohort'=>$data['cohort'],
        'currentTopic'=>$data['currentTopic'],
        'currentLesson'=>$data['currentLessonID']
    ]
];
print( json_encode( $output ));

?>