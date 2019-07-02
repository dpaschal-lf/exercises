<?php

if(!defined('INTERNAL')){
    exit('no direct calls');
}
$query = "SELECT id, title, orderID
    FROM lessons 
    WHERE topic = ?
    ORDER BY orderID";

$result = prepare_statement($query, [$_GET['topic']]);

if(!$result){
    throw new Exception('invalid query: '.$db->error);
}
if($result->num_rows===0){
    throw new Exception('no such topic');
}

$data = [];
$data['lessonList'] = [];
while( $row = $result->fetch_assoc()){
    $data['lessonList'][] = $row;
}

?>