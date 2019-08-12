<?php
if(!defined('INTERNAL')){
    exit('no direct calls');
}
$postData = get_body_data();

if(empty($postData['id'])){
    throw new Exception('must provide id');
}
if(empty($postData['orderID'])){
    throw new Exception('must provide orderID');
}

$query = "UPDATE users
    SET currentLessonOrderID = ?, currentLessonID = ?
    WHERE id= ?";

$result = prepare_statement($query, [
    $postData['orderID'],
    $postData['id'],
    $_SESSION['userID']
]);
if($db->affected_rows===0){
    throw new Exception('unable to update user');
}
$data = [
    'message'=> 'user updated',
    'lessonID'=>$postData['id']
];

?>