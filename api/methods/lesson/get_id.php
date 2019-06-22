<?php
if(!defined('INTERNAL')){
    exit('no direct calls');
}

$query = "SELECT * FROM lessons 
    WHERE orderID= ? AND topic= ?";

$result = prepare_statement($query, [$_GET['id'], $_GET['topic']]);
if(!$result){
    throw new Exception('invalid query: '.$db->error);
}

if($result->num_rows===0){
    throw new Exception("invalid lesson id $id");
}

$data = $result->fetch_assoc();

$query = "SELECT count(*) AS `total` FROM lessons WHERE topic='{$data['topic']}'";
$result = $db->query($query);
if(!$result){
    throw new Exception('invalid query: '.$db->error);
}
$data['total'] = $result->fetch_assoc()['total'];

?>