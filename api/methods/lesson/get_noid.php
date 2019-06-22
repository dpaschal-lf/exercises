<?php

if(!defined('INTERNAL')){
    exit('no direct calls');
}
$query = "SELECT id, title, orderID, topic
    FROM lessons 
    WHERE topic = ?
    ORDER BY topic, orderID";

$result = prepare_statement($query, [$_GET['topic']]);

if(!$result){
    throw new Exception('invalid query: '.$db->error);
}
if($result->num_rows===0){
    throw new Exception('no such topic');
}

$data = [];
while( $row = $result->fetch_assoc()){
    $data[] = $row;
}

?>