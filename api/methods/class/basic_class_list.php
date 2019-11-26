<?php

if(!defined('INTERNAL')){
    exit('no direct calls');
}
$query = "SELECT id, name FROM `classes` 
            WHERE `status`='signup'
            ORDER BY `created` DESC";

$result = $db->query($query);

if(!$result){
    throw new Exception('invalid query: '.$db->error);
}
if($result->num_rows===0){
    throw new Exception('no classes available');
}

$data = [];
while( $row = $result->fetch_assoc()){
    $data[] = $row;
}

?>