<?php

if(!defined('INTERNAL')){
    exit('no direct calls');
}
$userID = $_SESSION['userID'];
$postData = get_body_data();
if(empty($postData['lessonId'])){
    throw new Exception('must provide lesson ID');
}
if(empty($postData['helpMessage'])){
    throw new Exception('must provide a help message');
}
if(empty($postData['helpTopic'])){
    throw new Exception('must provide a help topic');
}
//$query = "INSERT INTO helpRequests SET userID = 9, lessonID = 2, requested = NOW(), problem = 'sdfwefwee', topic = 'git', `status` = 'active', requests = 0 ON DUPLICATE KEY UPDATE requests = requests + 1";
$query = "INSERT INTO helpRequests SET 
    userID = ?, lessonID = ?, requested = NOW(), 
    problem = ?, topic = ?, `status` = 'active', requests = 1
    ON DUPLICATE KEY UPDATE requests = requests + 1";

$result = prepare_statement($query, [
    $userID, 
    intval($postData['lessonId']), 
    $postData['helpMessage'],
    $postData['helpTopic']
]);
//$result = $db->query($query);
//print_r($db);
if(!$result){
    throw new Exception('invalid query: '.$db->error);
}
if($result->affected_rows===0){
    throw new Exception("could not insert/update");
}

$data = ['received'=>date("Y-m-d H:i:s")];

?>