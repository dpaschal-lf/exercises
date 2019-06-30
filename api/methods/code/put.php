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
    $query = "SELECT orderID, topic FROM lessons
    WHERE id=?";
    $result = prepare_statement($query, [$postData['id'] ]);
    if(!$result){
        throw new Exception('invalid query: '.$db->error);
    }
    if($result->num_rows===0){
        throw new Exception("cannot find information for {$postData['id']}");
    }
    $lessonData = $result->fetch_assoc();
    $query = "SELECT id, orderID FROM lessons
    WHERE topic = ? AND orderID > ? ORDER BY orderID ASC LIMIT 1";
    $result = prepare_statement($query, [$lessonData['topic'],$lessonData['orderID'] ]);
    if(!$result){
        throw new Exception('invalid query: '.$db->error);
    }
    if($result->num_rows===0){
        throw new Exception("no further lessons in {$lessonData['topic']} topic");
    }
    $nextLessonData = $result->fetch_assoc();
    $nextOrderID = $nextLessonData['orderID'];
    $nextLessonID = $nextLessonData['id'];
} else {
    $nextID = $postData['id'];
    $error = $postData['status'];
}
$query = "UPDATE users
    SET currentLessonOrderID = ?, currentLessonID = ?
    WHERE id= ?";

$result = prepare_statement($query, [
    $nextOrderID,
    $nextLessonID,
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
    'nextLessonID' => $nextLessonID,
    'nextOrderID'=> $nextOrderID,
    // 'topic' => $postData['topic']
];

?>