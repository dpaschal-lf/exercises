<?php
require_once('mysql_connect.php');
require_once('functions.php');
set_exception_handler('error_handler');

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


$result = prepare_statement($query, [$_POST['email']]);
// $statement = $db->prepare($query);

// if(!$statement){
//     throw new Exception('error with prepared statement: '.$db->error);
// }

// $statement->bind_param('s',$_POST['email']);

// $statement->execute();

// $result = $statement->get_result();

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
print( json_encode( $output ));

?>