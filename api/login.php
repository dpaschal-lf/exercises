<?php

require_once('functions.php');
set_error_handler('error_handler');

if(empty($_POST['email'])){
    throw new Exception('email must be specified');
}

$query = "SELECT * FROM students WHERE email=?";

$statement = $db->prepare($query);

$statement->bind_param('s',$_POST['email']);

$statement->execute();

if($result->num_rows===0){
    throw new Exception('no such user');
}

$result = $statement->get_result();

$data = $result->fetch_assoc();

session_start();

$_SESSION['userID'] = $data['id'];

$output = [
    'success'=>true,
    'data'=>[
        'id'=>$data['id'],
        'name'=>$data['name'],
        'cohort'=>$data['cohort'],
        'currentLesson'=>$data['currentLessonID']
    ]
];
print( json_encode( $output ));

?>