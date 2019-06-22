<?php
if(!defined('INTERNAL')){
    exit('no direct calls');
}
$postData = get_body_data();
if(empty($_SESSION['userID'])){
    throw new Exception('must be logged in');
}
if(empty($postData['id'])){
    throw new Exception('must provide id');
}
if(empty($postData['topic'])){
    throw new Exception('must provide topic');
}
if(empty($postData['code'])){
    throw new Exception('must provide code');
}
if(empty($postData['status'])){
    throw new Exception('must provide status');
}
$status = 'incomplete';
if($postData['status']==='pass'){
    $error = '';
    $status = 'complete';
    $query = "SELECT orderID FROM lessons
    WHERE topic = ? AND orderID = ?";
    $nextID = intVal($postData['id'])+1;
    $result = prepare_statement($query, [$postData['topic'],$nextID ]);
    if(!$result){
        throw new Exception('invalid query: '.$db->error);
    }
    if($result->num_rows===0){
        throw new Exception("no further lessons in {$postData['topic']} topic");
    }
} else {
    $nextID = $postData['id'];
    $error = $postData['status'];
}
$query = "UPDATE users
    SET currentLessonID = ?
    WHERE id= ?";

$result = prepare_statement($query, [
    $nextID,
    $_SESSION['userID']
]);

if($db->affected_rows===0){
    throw new Exception('unable to update user');
}
$codeQuery = "INSERT INTO codeSubmissions SET
    userID = ?, lessonID = ?, submitted = NOW(),
    `status` = '$status', code = ?, error = ?
";
$codeResult = prepare_statement($codeQuery, [
    $_SESSION['userID'],
    $postData['id'],
    $postData['code'],
    $error
]);
if($db->affected_rows===0){
    throw new Exception('unable to insert code');
}
$data = [
    'nextLessonID' => $nextID,
    'topic' => $postData['topic']
];

?>